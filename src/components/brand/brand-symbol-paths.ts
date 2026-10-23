/**
 * Canonical PrepCraft geometry. 512-unit artboard, optical bounds x=64..448,
 * y=16..496. One clear-space unit u=48 (one eighth of the visible width).
 * Exporters and React renderers both consume these paths. Do not edit exports.
 */
export const SYMBOL_VIEW_BOX = "0 0 512 512"
export const SYMBOL_UNIT = 48

export const symbolPaths = {
  silhouette: "M88 16H316C389 16 448 74 448 150V188C448 269 395 336 316 336H258C223 336 200 354 200 386C200 413 187 434 164 450L86 496C76 502 68 494 68 481V368C68 310 93 276 132 249C91 229 64 199 64 154V40C64 25 73 16 88 16Z",
  opening: "M200 108H336Q356 108 356 128V224Q356 244 336 244H258Q222 244 200 278Z",
  crown: "M88 16H316C389 16 448 74 448 150V182C448 135 406 108 356 108H252C228 108 210 103 190 90Z",
  mineral: "M88 16L174 77C193 91 200 112 200 138V278C216 256 234 244 258 244H336C390 244 431 221 448 182V188C448 269 395 336 316 336H258C223 336 200 354 200 386V199L132 249C91 229 64 199 64 154V40C64 25 73 16 88 16Z",
  turn: "M356 108C406 108 448 135 448 182C431 221 390 244 336 244Q356 244 356 224V128Q356 108 336 108Z",
  ribbon: "M200 199V386C200 413 187 434 164 450L86 496C76 502 68 494 68 481V368C68 310 93 276 132 249Z",
  spark: "M286 139C291 164 299 172 324 178C299 184 291 192 286 217C280 192 272 184 248 178C272 172 280 164 286 139Z",
  seams: "M88 18L190 90C210 103 228 108 252 108H336Q356 108 356 128V224Q356 244 336 244H258Q222 244 200 278M200 199L132 249C93 276 68 310 68 368V481M200 278V386",
} as const

export const symbolOutline = `${symbolPaths.silhouette} ${symbolPaths.opening}`

/** Material stops travel from an upper-left light to a lower-right shadow. */
export const symbolGradients = [
  { name: "copper", x1: "15%", y1: "0%", x2: "88%", y2: "100%", stops: [["0%", "#FFE2CA"], ["24%", "#E8AC88"], ["54%", "#A15F4B"], ["80%", "#C58766"], ["100%", "#653C31"]] },
  { name: "crown", x1: "40%", y1: "0%", x2: "55%", y2: "100%", stops: [["0%", "#FFE6D2"], ["35%", "#E9AF8C"], ["100%", "#A15F4B"]] },
  { name: "mineral", x1: "0%", y1: "0%", x2: "90%", y2: "100%", stops: [["0%", "#BBB2AA"], ["28%", "#554B45"], ["53%", "#25211F"], ["76%", "#84786F"], ["100%", "#D2C3B6"]] },
  { name: "turn", x1: "0%", y1: "0%", x2: "100%", y2: "50%", stops: [["0%", "#CC9372"], ["55%", "#A15F4B"], ["100%", "#744435"]] },
  { name: "ribbon", x1: "0%", y1: "80%", x2: "100%", y2: "20%", stops: [["0%", "#F6C49D"], ["30%", "#D78F67"], ["70%", "#A15F4B"], ["100%", "#E7AF8C"]] },
  { name: "edge", x1: "0%", y1: "0%", x2: "100%", y2: "100%", stops: [["0%", "#FFF1E5"], ["35%", "#E8B99A"], ["70%", "#A15F4B"], ["100%", "#E6AB87"]] },
] as const
