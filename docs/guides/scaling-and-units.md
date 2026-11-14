# Scaling and units: when the value is ten or a thousand times off

The register is read in the right order and still the voltage is 2301 instead of 230.1, or the current is 4560 instead of 4.56 A. Most meters send integers and expect you to apply a fixed scale.

## Fixed scale

Manuals write the scale in several ways that mean the same thing:

| Manual says | Meaning | Value read 2301 |
|---|---|---|
| "resolution 0.1 V", "× 0.1", "unit 0.1 V" | multiply by 0.1 | 230.1 V |
| "Value weight: Volt × 10", "÷ 10" | divide by 10 | 230.1 V |
| "1 decimal", "format XXX.X" | divide by 10 | 230.1 V |
| "mA", "mV", "Wh" as the unit | the integer is already in that unit | 2301 mV |

Watch the unit as well as the factor: an energy counter in Wh and one in kWh × 0.01 differ by a factor of ten.

## Scale set by the configuration

Some devices change the scale with a setting: the number of decimals shown on the display, the CT ratio or the voltage range. The manual then gives a table ("if register 40018 is 2, divide by 100"). Read that setting first.

## Scale factor registers (SunSpec and others)

SunSpec inverters and meters send each value with a separate *scale factor* register, a signed power of ten. The value is `register × 10^scale_factor`: a power of 4523 with a scale factor of −1 is 452.3 W. The scale factor can change while the device runs, so read it with the value, in the same request.

## Floats

Values sent as 32-bit floats (IEEE 754) need no scale; they are already in engineering units. If a float looks absurd, check the [word order](byte-and-word-order) before the scale.

## How MBMap maps record it

A register has a `scale` (the multiplier), an optional `offset`, a `unit`, or a `scale_factor` naming the register that holds the power of ten. The device pages and the exports apply them, so the number you configure is the one in the manual.
