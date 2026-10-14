# Attribution

The maps in this repository are released under [CC0 1.0](LICENSE), with one
class of exception described here. Many maps were converted from other
catalogues of Modbus register tables. Those maps carry `@x_status=unverified`
and `@x_origin=<source>` in the file, plus the original source in `@source`.

A converted map is a starting point. It has **not** been checked against the
manufacturer's documentation; correct it and remove `@x_status` once it has
been (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## Modbus Database

Maps with `@x_origin=modbus-database` were converted from the Modbus Database
by Jibril Sharafi, which is published under the MIT licence:

```text
MIT License

Copyright (c) 2024 Jibril Sharafi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The converted files keep this notice by reference to this file.

## Omni Console device library

Maps with `@x_origin=omniconsole` were converted from the device library of
Omni Console by OmniCoreST (`modbus-library/` in its public repository, which
describes the catalogue as open and invites contributions). That repository
does not state a licence for the files. If you are the author and want a map
removed or credited differently, open an issue and it will be done.

## Facts and sources

Register addresses, types and units are facts about a device. Each converted
map also names the original table in `@source`, and the source's own header
notes (document name, revision, address conventions) are kept in comments at
the top of the file.
