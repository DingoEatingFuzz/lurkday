# Lurkday

Did you know you can "print" an org chart from Workday as an excel sheet?

This CLI utility takes that excel sheet and lets you quickly answer basic questions you may have about your coworkers.

## Installation

Use a node package manager:

```shellsession
$ bunx lurkday path/to/file.xlsx
```

or

```shellsession
$ npx lurkday path/to/file.xlsx
```

or

```shellsession
$ npm i -g lurkday
$ lurkday path/to/file.xlsx
```

Don't have or want a node environment? You can do something like this to use Docker:

```shellsession
$ docker run -it --rm -v ./:/fs node:20 npx lurkday /fs/file.xlsx
```

## How to lurk

First, get an export of the org chart:

  1. Go to the top of your reporting chain
  2. Click the print button (lol)
  3. Choose Excel as the output format and All for levels

Now run the `lurkday` command to start an interactive prompt:

```shellsession
$ lurkday exported-file.xlsx
Lurking 2,000 people
> 
```

Once in the interactive prompt, there are a handful of commands:

  1. `help`
  2. `tree`
  3. `directs`
  4. `chain`
  5. `peers`

Use the `help` command to get specifics on each, but the tl;dr is you do something like `directs My Coworker` and it'll work out.

## Exporting

In case you want to do an even deeper lurk, all commands (other than `help`) will let you export to a `json`, `ndjson`, `csv`, or `tsv` file using the following syntax:

```shellsession
> tree That One VP > vp-tree.ndjson
```
