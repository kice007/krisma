// Leaflet + regroupement des repères. leaflet.markercluster attend un `L`
// global : on l'expose avant de le charger.
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { Beef, Croissant, Scissors, ShoppingBasket, Store, Utensils } from 'lucide-react'

window.L = L
await import('leaflet.markercluster')

export default L

export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'

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
    svgCache.set(category, renderToStaticMarkup(createElement(CATEGORY_ICON[category] || Store, { size: 20, color: '#ffffff', strokeWidth: 2 })))
  }
  return svgCache.get(category)
}

// Repère en goutte, couleur du statut public, pictogramme de la catégorie.
export function shopIcon(shop, selected) {
  const color = STATUS_COLOR[shop.public_status] || '#111111'
  const ring = selected ? `<span class="km-ring" style="border-color:${color}"></span>` : ''
  return L.divIcon({
    className: 'km-pin',
    html: `${ring}<svg viewBox="0 0 44 54" width="44" height="54"><path d="${PIN}" fill="${color}"/></svg><span class="km-pin-icon">${iconSvg(shop.category)}</span>`,
    iconSize: [44, 54],
    iconAnchor: [22, 54],
  })
}

// Pastille noire avec le nombre de commerces regroupés.
export function clusterIcon(cluster) {
  const n = cluster.getChildCount()
  const size = n < 10 ? 44 : n < 100 ? 52 : 60
  return L.divIcon({ className: 'km-cluster', html: `<span>${n}</span>`, iconSize: [size, size] })
}

// Repère orange déplaçable du formulaire de proposition.
export function draftIcon(category) {
  return L.divIcon({
    className: 'km-pin',
    html: `<svg viewBox="0 0 44 54" width="44" height="54"><path d="${PIN}" fill="#fd8030"/></svg><span class="km-pin-icon">${iconSvg(category || 'other')}</span>`,
    iconSize: [44, 54],
    iconAnchor: [22, 54],
  })
}
