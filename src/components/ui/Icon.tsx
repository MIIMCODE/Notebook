import type { SVGProps } from 'react'

type IconName =
  | 'plus'
  | 'search'
  | 'pin'
  | 'archive'
  | 'trash'
  | 'folder'
  | 'tag'
  | 'settings'
  | 'close'
  | 'check'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'highlight'
  | 'list'
  | 'listOrdered'
  | 'checklist'
  | 'quote'
  | 'code'
  | 'table'
  | 'image'
  | 'mic'
  | 'pen'
  | 'link'
  | 'home'
  | 'grid'
  | 'calendar'
  | 'clock'
  | 'wallet'
  | 'target'
  | 'kanban'
  | 'sun'
  | 'moon'
  | 'user'
  | 'download'
  | 'upload'
  | 'history'
  | 'play'
  | 'pause'
  | 'bell'
  | 'palette'
  | 'globe'
  | 'menu'
  | 'more'
  | 'chevronDown'
  | 'chevronRight'
  | 'arrowLeft'
  | 'play'
  | 'stop'
  | 'copy'
  | 'filter'
  | 'sort'
  | 'lock'
  | 'fingerprint'
  | 'cloud'
  | 'cloudOff'
  | 'refresh'
  | 'edit'
  | 'sparkle'
  | 'x'
  | 'heading1'
  | 'heading2'
  | 'undo'
  | 'redo'
  | 'board'
  | 'book'
  | 'chart'
  | 'smile'
  | 'weather'
  | 'pinOff'
  | 'login'
  | 'logout'

const paths: Record<IconName, JSX.Element> = {
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 17v5" />
      <path d="M9 2h6l-1 6 3 3v2H7v-2l3-3-1-6z" />
    </>
  ),
  pinOff: (
    <>
      <path d="M12 17v5" />
      <path d="M9 2h6l-1 6 3 3v2H7v-2l3-3-1-6z" />
      <path d="M3 3l18 18" />
    </>
  ),
  archive: (
    <>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />,
  tag: (
    <>
      <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9z" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.33-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  bold: <path d="M6 4h7a4 4 0 0 1 0 8H6zM6 12h8a4 4 0 0 1 0 8H6z" />,
  italic: <path d="M10 4h8M6 20h8M14 4l-4 16" />,
  underline: <path d="M6 4v6a6 6 0 0 0 12 0V4M6 20h12" />,
  highlight: (
    <>
      <path d="M9 11l4-4 4 4-6 6H9v-4z" />
      <path d="M4 21h16" />
    </>
  ),
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  listOrdered: (
    <path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M4 15.5c0-1 2-1.5 2 0s-2 1-2 2.5h2" />
  ),
  checklist: (
    <>
      <path d="M10 6h11M10 12h11M10 18h11" />
      <path d="M3 6.5l1.5 1.5L7 5" />
      <path d="M3 16.5L4.5 18 7 15" />
    </>
  ),
  quote: (
    <path d="M7 15c-2 0-3-1.5-3-3.5S5.5 8 7.5 8H9v3c0 3-1.5 5-4 6zM17 15c-2 0-3-1.5-3-3.5S15.5 8 17.5 8H19v3c0 3-1.5 5-4 6z" />
  ),
  code: <path d="M8 6l-5 6 5 6M16 6l5 6-5 6M13.5 4l-3 16" />,
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 10h18M3 15h18M9 4v16M15 4v16" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M3 17l5-4 4 3 3-2 6 5" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  pen: <path d="M4 20l4-1L20 7a2.1 2.1 0 0 0-3-3L5 16l-1 4zM14.5 6.5l3 3" />,
  link: (
    <path d="M10 14a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
  ),
  home: <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9z" />,
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M16 14h2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  kanban: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1" />
      <rect x="9.5" y="4" width="5" height="11" rx="1" />
      <rect x="16" y="4" width="5" height="7" rx="1" />
    </>
  ),
  board: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5" />
    </>
  ),
  download: <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 20h16" />,
  upload: <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 20h16" />,
  pause: <path d="M9 5v14M15 5v14" />,
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3 9" />
      <path d="M3 4v5h5M12 7.5V12l3 2" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2s0-2 1.5-2h2a4 4 0 0 0 4-4c0-5-4-10-9-10z" />
      <circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5m0 0l6-6m-6 6l6 6" />,
  play: <path d="M7 5l12 7-12 7V5z" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  filter: <path d="M4 5h16l-6 7v6l-4 2v-8L4 5z" />,
  sort: <path d="M7 4v16m0 0l-3-3m3 3l3-3M17 20V4m0 0l-3 3m3-3l3 3" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  fingerprint: (
    <>
      <path d="M12 10.5a1.5 1.5 0 0 1 1.5 1.5c0 3-.5 5.5-1.5 8" />
      <path d="M9 21c1.2-2.7 1.7-5.4 1.7-9A1.3 1.3 0 0 1 13.4 12c0 1.4-.1 2.8-.4 4.2" />
      <path d="M6.3 17.5C7 15.6 7.3 13.8 7.3 12a4.7 4.7 0 0 1 9.4 0c0 1 0 1.9-.2 2.8" />
      <path d="M4.5 13.5A7.5 7.5 0 0 1 12 6a7.5 7.5 0 0 1 7.5 7.5" />
    </>
  ),
  cloud: <path d="M7 18a4.5 4.5 0 1 1 .8-8.9A6 6 0 0 1 19 11.5 3.5 3.5 0 0 1 18 18H7z" />,
  cloudOff: (
    <>
      <path d="M7 18a4.5 4.5 0 1 1 .8-8.9A6 6 0 0 1 19 11.5 3.5 3.5 0 0 1 18 18h-4" />
      <path d="M3 3l18 18" />
    </>
  ),
  refresh: <path d="M20 11a8 8 0 1 0-.7 4.5M20 5v6h-6" />,
  edit: <path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4zM14.5 6.5l3 3" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  heading1: <path d="M4 5v14M12 5v14M4 12h8M16 9l2-1v11" />,
  heading2: <path d="M4 5v14M12 5v14M4 12h8M15 10a3 3 0 1 1 5 2c-1.5 1.5-5 2-5 4h6" />,
  undo: <path d="M8 7L4 11l4 4M4 11h9a6 6 0 0 1 0 12h-3" />,
  redo: <path d="M16 7l4 4-4 4M20 11h-9a6 6 0 0 0 0 12h3" />,
  book: <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2V5z" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  smile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01" />
    </>
  ),
  weather: (
    <path d="M7 16a4.5 4.5 0 1 1 .8-8.9A6 6 0 0 1 19 9.5 3.5 3.5 0 0 1 18 16H7zM8 20h.01M12 20h.01M16 20h.01" />
  ),
  login: <path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5M10 8l4 4-4 4M14 12H3" />,
  logout: <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M16 8l4 4-4 4M20 12H9" />,
}

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 20, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}

export type { IconName }
export default Icon
