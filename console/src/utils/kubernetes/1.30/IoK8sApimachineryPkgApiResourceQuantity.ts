import type { IoK8sApimachineryPkgApiResourceQuantity } from "@/models/kubernetes/1.30/types";

export type SuffixDecimalSI = "k" | "M" | "G" | "T" | "P" | "E";
export type SuffixBinarySI = "Ki" | "Mi" | "Gi" | "Ti" | "Pi" | "Ei";
export type QuantityDescriptorUnit =
  | "m"
  | "B"
  | SuffixBinarySI
  | SuffixDecimalSI;

export enum DecimalSI {
  k = 1000,
  M = 1000 ** 2,
  G = 1000 ** 3,
  T = 1000 ** 4,
  P = 1000 ** 5,
  E = 1000 ** 6,
}

export enum BinarySI {
  Ki = 1024,
  Mi = 1024 ** 2,
  Gi = 1024 ** 3,
  Ti = 1024 ** 4,
  Pi = 1024 ** 5,
  Ei = 1024 ** 6,
}

/**
 * A Kubernetes resource quantity.
 * @see https://pkg.go.dev/k8s.io/apimachinery/pkg/api/resource#Quantity
 *
 * The official serialization format is:
 * ```txt
 * <quantity>        ::= <signedNumber><suffix>
 * <digit>           ::= 0 | 1 | ... | 9
 * <digits>          ::= <digit> | <digit><digits>
 * <number>          ::= <digits> | <digits>.<digits> | <digits>. | .<digits>
 * <sign>            ::= "+" | "-"
 * <signedNumber>    ::= <number> | <sign><number>
 * <suffix>          ::= <binarySI> | <decimalExponent> | <decimalSI>
 * <binarySI>        ::= Ki | Mi | Gi | Ti | Pi | Ei
 * <decimalSI>       ::= k  | M  | G  | T  | P  | E  | m | ""
 * <decimalExponent> ::= "e" <signedNumber> | "E" <signedNumber>
 * ```
 *
 * Notes:
 * 1. The sign is left apart, since it is expresed as part of the `value` field.
 * 2. Plain integers are interpreted as bytes therefore their unit is set to "B".
 * 3. The decimal SI fractional unit ('m') is not considered part of that suffix by this implementation.
 */
export interface QuantityDescriptor {
  unit: QuantityDescriptorUnit;
  value: number;
}

const QUANTITY_RE =
  /^(?<sign>[+-])?(?<number>\d+|\d+\.\d+|\.\d+|\d+\.)(?<suffix>[mk]|Ki|[MGTPE]i?)?$/;

export const parseQuantity = (
  quantity: IoK8sApimachineryPkgApiResourceQuantity
): QuantityDescriptor | Error => {
  const descriptor: QuantityDescriptor = { unit: "B", value: 0 };

  // When quantity is expressed as a plain integer, it is interpreted as bytes.
  if (typeof quantity === "number") {
    descriptor.value = quantity;
  } else {
    const result = quantity.match(QUANTITY_RE);
    if (!result) {
      return new Error(
        "quantities must match the regular expression " + QUANTITY_RE
      );
    }

    const number = result.groups?.["number"];
    if (number) {
      descriptor.value = number.includes(".")
        ? parseFloat(number)
        : parseInt(number, 10);
    } else {
      return new Error("unable to parse numeric part of quantity");
    }

    const suffix = result.groups?.["suffix"];
    if (suffix) {
      descriptor.unit = suffix as QuantityDescriptorUnit;
    } else {
      return new Error("unable to parse quantity's suffix");
    }
  }

  return descriptor;
};
