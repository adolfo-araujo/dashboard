// Aplica o tema escolhido antes de desenhar a página (evita piscar). Padrão: escuro.
(function () {
  var tema = 'escuro'
  try {
    if (localStorage.getItem('valtrea:tema') === 'claro') tema = 'claro'
  } catch (e) {}
  document.documentElement.setAttribute('data-tema', tema)
  var cor = document.querySelector('meta[name="theme-color"]')
  if (cor) cor.setAttribute('content', tema === 'claro' ? '#FFFFFF' : '#0D0F12')
})()
