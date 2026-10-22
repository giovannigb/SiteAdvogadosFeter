# Site Advogados Feter

## Gerar os arquivos de produção

As folhas `css/site.min.css` e `css/area-page.min.css`, o JavaScript
`js/site-enhancements.min.js` e o CSS crítico incorporado em `index.html` são
gerados a partir dos arquivos-fonte do projeto.

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
não utilizadas, incorpora o CSS crítico e minifica os arquivos publicados.
