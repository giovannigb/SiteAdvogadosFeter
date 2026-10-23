# Site Advogados Feter

## Gerar os arquivos de produção

As folhas `css/site.min.css` e `css/area-page.min.css`, o JavaScript
`js/site-enhancements.min.js`, o CSS crítico incorporado em `index.html` e as
variantes responsivas da imagem principal são gerados a partir dos arquivos-fonte
do projeto. Edite `css/critical.css` para alterar apenas os estilos do primeiro
quadro e mantenha `img/nat-marco-maos-2026-1920.jpg` como imagem-mestra do hero.

Na primeira utilização, instale as dependências isoladas das ferramentas:

```powershell
pnpm --dir dev-tools install
```

Depois de qualquer alteração nos arquivos CSS ou JavaScript, regenere os pacotes
com um único comando:

```powershell
pnpm --dir dev-tools run build:assets
```

O gerador consolida os estilos, ajusta os caminhos dos recursos, remove regras
não utilizadas, incorpora o CSS crítico, minifica os arquivos publicados e cria
as versões AVIF, WebP e JPEG do hero para desktop e celular.
