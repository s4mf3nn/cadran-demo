import { createCn } from "cn/config"

// Tailles maison (cf. --text-* dans index.css) : sans ça, `text-body` passerait pour une couleur et sauterait face à `text-muted`.
export const cn = createCn({
  extend: { classGroups: { "font-size": [{ text: ["display", "stat", "title", "body", "caption", "micro"] }] } },
})
