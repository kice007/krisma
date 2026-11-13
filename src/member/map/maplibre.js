// KRISMA Map sur MapLibre : fond OpenFreeMap en couleur (vectoriel, gratuit,
// sans clé, autorisé en production), projection globe au dézoom, repères en
// goutte et regroupement calculé à l'écran.
import * as maplibregl from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { Beef, Croissant, Scissors, ShoppingBasket, Store, Utensils } from '../../components/icons'

// Une fois empaqueté, MapLibre ne retrouve pas seul son worker : on lui donne l'URL.
maplibregl.setWorkerUrl(workerUrl)

export const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

export const STATUS_COLOR = {
  proposed: '#9ca3af',
  validated: '#111111',
  contacted: '#0676f8',
  partner: '#fd8030',
  cashback_active: '#15803d',
}

export const CATEGORY_ICON = { grocery: ShoppingBasket, butcher: Beef, bakery: Croissant, hair_salon: Scissors, restaurant: Utensils, other: Store }

const PIN = 'M22 0c-12.15 0-22 9.85-22 22 0 15.5 22 32 22 32s22-16.5 22-32c0-12.15-9.85-22-22-22z'
const svgCache = new Map()
const iconSvg = (category) => {
  if (!svgCache.has(category)) {
    svgCache.set(category, renderToStaticMarkup(createElement(CATEGORY_ICON[category] || Store, { size: 20, color: '#ffffff' })))
  }
  return svgCache.get(category)
}

function pinHtml(color, category, selected) {
  const ring = selected ? `<span class="km-ring" style="border-color:${color}"></span>` : ''
  return `${ring}<svg viewBox="0 0 44 54" width="44" height="54"><path d="${PIN}" fill="${color}"/></svg><span class="km-pin-icon">${iconSvg(category)}</span>`
}

// Élément DOM d'un repère (statut public → couleur, catégorie → pictogramme).
export function pinElement(shop, selected) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'km-pin'
  el.title = shop.name || ''
  el.setAttribute('aria-label', shop.name || '')
  el.innerHTML = pinHtml(STATUS_COLOR[shop.public_status] || '#111111', shop.category, selected)
  return el
}

// Repère orange du formulaire de proposition.
export function draftElement(category) {
  const el = document.createElement('div')
  el.className = 'km-pin'
  el.innerHTML = pinHtml('#fd8030', category || 'other', false)
  return el
}

function clusterElement(n) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'km-cluster'
  const size = n < 10 ? 44 : n < 100 ? 52 : 60
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.textContent = String(n)
  return el
}

// Nouvelle carte. center = [lat, lng]. Projection globe : la Terre apparaît en
// boule quand on dézoome assez loin.
export function createMap(el, { center, zoom = 12, scrollZoom = true, interactive = true, lang = document.documentElement.lang || 'fr' } = {}) {
  const map = new maplibregl.Map({
    container: el,
    style: STYLE_URL,
    center: [center[1], center[0]],
    zoom,
    attributionControl: { compact: true },
    scrollZoom,
    interactive,
    maxZoom: 19,
    minZoom: 1.6,
    dragRotate: false,
    pitchWithRotate: false,
  })
  map.touchZoomRotate.disableRotation()
  // Mention des sources repliée (bouton ⓘ) pour ne pas masquer la carte.
  map.on('load', () => el.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show'))
  map.on('style.load', () => {
    try {
      map.setProjection({ type: 'globe' })
    } catch {
      /* ancien navigateur : carte plate */
    }
    // Noms des lieux dans la langue du site (sinon nom local).
    const field = ['coalesce', ['get', lang === 'en' ? 'name:en' : 'name:fr'], ['get', 'name']]
    for (const layer of map.getStyle().layers) {
      // Seulement les noms de lieux (pas les numéros des routes, « ref »).
      if (layer.type === 'symbol' && JSON.stringify(layer.layout?.['text-field'] ?? '').includes('name')) {
        try {
          map.setLayoutProperty(layer.id, 'text-field', field)
        } catch {
          /* couche sans nom (numéros de route…) */
        }
      }
    }
  })
  return map
}

export const toLngLat = (p) => [p.lng, p.lat]

// Cadre la carte sur une liste de points [lat, lng].
export function fitPoints(map, pts, padding, maxZoom = 15) {
  if (!pts.length) return
  if (pts.length === 1) return map.jumpTo({ center: [pts[0][1], pts[0][0]], zoom: maxZoom })
  const b = new maplibregl.LngLatBounds()
  pts.forEach(([lat, lng]) => b.extend([lng, lat]))
  map.fitBounds(b, { padding, maxZoom, duration: 0 })
}

// Couche de commerces : repères HTML + regroupement simple à l'écran (rayon 48 px).
// Le commerce sélectionné n'est jamais regroupé.
export class ShopLayer {
  constructor(map, onSelect) {
    this.map = map
    this.onSelect = onSelect
    this.shops = []
    this.selectedId = null
    this.markers = []
    this.render = this.render.bind(this)
    map.on('moveend', this.render)
  }

  set(shops, selectedId) {
    this.shops = shops
    this.selectedId = selectedId
    this.render()
  }

  clear() {
    this.markers.forEach((m) => m.remove())
    this.markers = []
  }

  render() {
    const map = this.map
    this.clear()
    if (!map.getContainer().isConnected) return
    const R = 48
    const groups = []
    for (const s of this.shops) {
      if (s.id === this.selectedId) continue
      const p = map.project([s.lng, s.lat])
      const g = groups.find((x) => Math.hypot(x.x - p.x, x.y - p.y) < R)
      if (g) {
        g.items.push(s)
        g.x = (g.x * (g.items.length - 1) + p.x) / g.items.length
        g.y = (g.y * (g.items.length - 1) + p.y) / g.items.length
      } else groups.push({ x: p.x, y: p.y, items: [s] })
    }
    const zoom = map.getZoom()
    for (const g of groups) {
      if (g.items.length === 1 || zoom >= 18) {
        g.items.forEach((s) => this.addPin(s, false))
      } else {
        const el = clusterElement(g.items.length)
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          fitPoints(map, g.items.map((s) => [s.lat, s.lng]), 80, Math.min(zoom + 3, 18))
        })
        this.markers.push(new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(map.unproject([g.x, g.y])).addTo(map))
      }
    }
    const sel = this.shops.find((s) => s.id === this.selectedId)
    if (sel) this.addPin(sel, true)
  }

  addPin(s, selected) {
    const el = pinElement(s, selected)
    if (selected) el.style.zIndex = '2'
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      this.onSelect?.(s)
    })
    this.markers.push(new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([s.lng, s.lat]).addTo(this.map))
  }

  destroy() {
    this.map.off('moveend', this.render)
    this.clear()
  }
}

export { maplibregl }
