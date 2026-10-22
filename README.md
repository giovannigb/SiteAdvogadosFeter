# Site Advogados Feter

## Gerar os arquivos CSS de produção

As folhas `css/site.min.css`, `css/site-critical.min.css` e
`css/area-page.min.css` são geradas a partir dos arquivos CSS-fonte do projeto.

Na primeira utilização, instale as dependências isoladas das ferramentas:

```powershell
pnpm --dir dev-tools install
```

Depois de qualquer alteração nos arquivos CSS-fonte, regenere os três pacotes
com um único comando:

```powershell
pnpm --dir dev-tools run build:css
```

O gerador consolida os estilos, ajusta os caminhos dos recursos, remove regras
não utilizadas da página principal e minifica os arquivos publicados.
