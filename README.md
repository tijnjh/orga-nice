# orga-nice

custom program i wrote to organize my projects folder

- only works on macos
- requires [tag](https://formulae.brew.sh/formula/tag)
- uses bun

## what it does

- it will tag each folder by their git domain, (github.com, codeberg.org)*
- make local dir name match remote*
- delete DS_Store

_* doesn't apply to non git repo folders_


## usage

```sh
git clone https://github.com/tijnjh/orga-nice

cd orga-nice

// install deps
bun i
```
before running, you should change the `PROJECTS_DIR` (line 6 of index.ts) to your folder, then:

```
// run the script
bun .
```
