// Aplica o tema escolhido antes de desenhar a página (evita piscar). Padrão: claro.
(function () {
  var tema = 'claro'
  try {
    if (localStorage.getItem('valtrea:tema') === 'escuro') tema = 'escuro'
  } catch (e) {}
  document.documentElement.setAttribute('data-tema', tema)
  var cor = document.querySelector('meta[name="theme-color"]')
  if (cor) cor.setAttribute('content', tema === 'escuro' ? '#0D0F12' : '#F3F4F6')
})()
