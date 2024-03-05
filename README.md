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

## Command mode

When running Lurkday, the default behavior is to open a REPL. This is nice for poking around at data, but it doesn't lend itself to automation.

To make automation easier, Lurkday can be run in command mode using the following format:

```shellsession
$ lurkday file.xlsx -c "tree That One VP"
```

This will print the reporting tree to `stdout` and terminate the process.

If you want to print in a supported export format, provide the `--format` flag like so:

```shellsession
$ lurkday file.xlsx --format ndjson -c "tree That One VP"
```

> [!WARNING]
> Since command mode is non-interactive, there is no opportunity to disambiguate a name. If the name is not an exact match, the program will error. To make sure you have an exact match, use the `find` command to get a person's Strong Enough Identifier™.

### Strong Enough Identifiers

Workday's xlsx exports do not include strong identifiers. Person and Parent IDs are not guaranteed to be consistent across exports. To combat this, Lurkday can look up people using a combination of name and location or a combination of name and title. Since titles and locations are subject to change over time, there is still no guarantee that this will match people across exports. Thus, the identifier isn't strong, just strong enough (usually).

```shellsession
$ lurkday file.xslx
> Lurking 2,000 people
> find Jane Doe
? Multiple potential matches. Please select one:
❯ Jane Doe (4 directs, 10 total) Sr. Director, Support Operations SF Bay Area
  Jane Doe Sr. Support Engineer Australia
  Jane Dow (5 directs, 143 total) VP, Engineering California
Jane Doe Sr. Support Engineer Australia

Strong Enough Identifiers:

  l/Jane Doe::Australia/
  t/Jane Doe::Sr. Support Engineer/

$ lurkday file.xlsx -c "chain l/Jane Doe::Australia/"
  Alan Locke Chief Executive Officer SF Bay Area
  Bret Loser VP Engineering, Support Seattle, Washington
* Jane Doe Sr. Support Engineer Australia
```
