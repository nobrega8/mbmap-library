# Byte order and word order: when 32-bit values come out wrong

A voltage reads 1.7 × 10³⁸, an energy counter jumps by 65 536 at a time, or a temperature is a tiny negative number. The registers are right; the order in which the two registers of a 32-bit value are put together is not.

## One register is easy, two are not

A Modbus register is 16 bits, sent most significant byte first. The standard says nothing about values longer than one register, so every manufacturer chooses how to split a 32-bit integer or float across two registers (and a 64-bit value across four).

The four orders are usually named after the bytes of the value, `A` being the most significant:

| Name | Register 1 | Register 2 | Also called |
|---|---|---|---|
| `ABCD` | A B | C D | big-endian, high word first |
| `CDAB` | C D | A B | word swap, low word first, LSW first |
| `BADC` | B A | D C | byte swap |
| `DCBA` | D C | B A | little-endian, both swapped |

`ABCD` and `CDAB` cover almost every device. `CDAB` is common on Schneider, Carlo Gavazzi and many Chinese meters; `ABCD` on Siemens, Janitza and most SunSpec devices.

## How to find the right one

1. **Read the manual's data format section.** Look for "word order", "LSW first", "MSW first", "high word first" or "big endian".
2. **Read a value you know.** Read a voltage that should be around 230 V as a float in each order. Only one gives a sensible number.
3. **Watch a counter.** If an energy counter's low register rolls over into what your tool shows as the high part, swap the words.
4. **Check 64-bit values separately.** Some devices store 32-bit values high word first and 64-bit values in another order.

## Strings

Text is usually two characters per register, first character in the high byte. A few devices put the first character in the low byte, which makes "EM24" read as "ME42".

## How MBMap maps record it

A map sets `byte_order` and `word_order` for the whole device, and any register can override them. The device pages show the order of every multi-register value in the notation above (for example `float32 CDAB`), and the Home Assistant export turns it into the right `swap:` option.
