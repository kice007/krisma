// Génère src/components/icons.jsx : les icônes Iconsax utilisées par le site,
// réduites aux variantes Linear et Bold (le paquet en embarque 6 par icône).
// Les icônes restent exposées sous les noms Lucide utilisés jusqu'ici.
// Lancer : node scripts/build-icons.mjs (après avoir modifié la table MAP).
import fs from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as I from 'iconsax-reactjs'

const MAP = {
  AlertCircle: 'InfoCircle', AlertTriangle: 'Warning2', ArrowDownLeft: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowUpRight: 'ArrowUp',
  BadgeCheck: 'Verify', Beef: 'Reserve', Bell: 'Notification', ChartColumn: 'Chart', Check: 'Check', ChevronDown: 'ArrowDown2',
  Circle: 'Record', CircleCheck: 'TickCircle', CircleSlash: 'Slash', Coffee: 'Coffee', Copy: 'Copy', CornerDownLeft: 'ArrowLeft3',
  CornerDownRight: 'ArrowRight3', Croissant: 'Cake', Crosshair: 'Gps', Download: 'DocumentDownload', Ellipsis: 'More', Eye: 'Eye',
  EyeOff: 'EyeSlash', FileSpreadsheet: 'TableDocument', FileText: 'DocumentText', Gift: 'Gift', Globe: 'Global', HandCoins: 'MoneyRecive',
  Heart: 'Heart', History: 'Clock', Hourglass: 'Timer', House: 'Home2', Inbox: 'DirectInbox', Info: 'InfoCircle', KeyRound: 'Key',
  LayoutDashboard: 'Category', List: 'TaskSquare', ListChecks: 'TaskSquare', LoaderCircle: 'Refresh2', LocateFixed: 'Location',
  Lock: 'Lock1', LockKeyhole: 'Lock', LogOut: 'Logout', Mail: 'Sms', MailCheck: 'SmsTracking', Map: 'Map1', MapPin: 'Location',
  Megaphone: 'Speaker', Menu: 'HamburgerMenu', MessageCircle: 'Message', Minus: 'Minus', MonitorSmartphone: 'Devices',
  MousePointerClick: 'Mouse', Move: 'Maximize3', Navigation: 'Routing2', Percent: 'PercentageCircle', Plus: 'Add', RotateCw: 'RotateRight',
  Scissors: 'Scissor', ScrollText: 'Document', Search: 'SearchNormal1', Send: 'Send2', Share2: 'Share', Shield: 'Shield',
  ShieldAlert: 'ShieldSecurity', ShieldCheck: 'ShieldTick', ShieldX: 'ShieldCross', ShoppingBag: 'Bag2', ShoppingBasket: 'ShoppingCart',
  Sparkles: 'Magicpen', Star: 'Star1', Store: 'Shop', Timer: 'Timer1', Trash2: 'Trash', TrendingDown: 'TrendDown', TrendingUp: 'TrendUp',
  TriangleAlert: 'Warning2', Trophy: 'Cup', User: 'User', UserPlus: 'UserAdd', Users: 'People', UserX: 'UserRemove', Utensils: 'Coffee',
  X: 'Add', XCircle: 'CloseCircle',
}
const ROTATE = new Set(['X']) // croix simple = « + » tourné de 45°

const inner = (name, variant) => {
  const svg = renderToStaticMarkup(createElement(I[name], { variant, color: 'currentColor', size: 24 }))
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
}

const shapes = {}
for (const icon of new Set(Object.values(MAP))) {
  if (!I[icon]) throw new Error(`Icône Iconsax introuvable : ${icon}`)
  shapes[icon] = { Linear: inner(icon, 'Linear'), Bold: inner(icon, 'Bold') }
}

const out = `// Fichier généré par scripts/build-icons.mjs : ne pas modifier à la main.
// Icônes Iconsax (Vuesax), variantes Linear et Bold, sous les noms Lucide utilisés
// par le site. variant="Bold" pour une icône pleine ; strokeWidth est ignoré.
import { forwardRef } from 'react'

const S = ${JSON.stringify(shapes)}

function make(key, name, rotate) {
  const C = forwardRef(function KIcon({ size = 24, variant = 'Linear', color, strokeWidth: _sw, absoluteStrokeWidth: _asw, style, ...rest }, ref) {
    const shape = S[key][variant] ?? S[key].Linear
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden={rest['aria-label'] ? undefined : true}
        style={{ ...(color ? { color } : null), ...(rotate ? { transform: 'rotate(45deg)' } : null), ...style }}
        dangerouslySetInnerHTML={{ __html: shape }}
        {...rest}
      />
    )
  })
  C.displayName = name
  return C
}

${Object.entries(MAP).map(([lucide, icon]) => `export const ${lucide} = make('${icon}', '${lucide}'${ROTATE.has(lucide) ? ', true' : ''})`).join('\n')}
`
fs.writeFileSync(new URL('../src/components/icons.jsx', import.meta.url), out)
console.log(`${Object.keys(MAP).length} icônes, ${Object.keys(shapes).length} tracés, ${Math.round(out.length / 1024)} Ko`)
