// Loop-provided document templates. Plain text on purpose — readable and
// easy to negotiate inline without rich-text editor complexity. Substitution
// is `{{token}}` style; the renderer in the document viewer replaces tokens
// with values from `fields`.

export type ContractFields = {
  scope: string;
  deliverables: string;
  timeline: string;
  price: string;
  payment_terms: "on_signing" | "on_delivery" | "milestones";
  refund_policy: "non_refundable" | "refund_until_start" | "pro_rata_refund";
  jurisdiction: string;
  effective_date: string;
};

export const DEFAULT_CONTRACT_FIELDS: ContractFields = {
  scope: "",
  deliverables: "",
  timeline: "",
  price: "",
  payment_terms: "on_delivery",
  refund_policy: "refund_until_start",
  jurisdiction: "Delaware, USA",
  effective_date: new Date().toISOString().slice(0, 10),
};

// Loop NDA — short, mutual, founder-friendly. Borrowed from the YC mutual
// NDA pattern.
export const LOOP_NDA_TEMPLATE = `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into between {{party_a}} and {{party_b}} (each a "Party" and collectively the "Parties") effective {{effective_date}}.

1. CONFIDENTIAL INFORMATION
Each Party may share non-public business, technical, product, customer, and financial information with the other ("Confidential Information"). Information is Confidential whether marked or not, except information that is (a) publicly known through no breach of this Agreement, (b) lawfully received from a third party without restriction, or (c) independently developed without use of the other Party's Confidential Information.

2. OBLIGATIONS
Each Party will (a) hold the other's Confidential Information in strict confidence, (b) use it only to evaluate and pursue a potential business relationship between the Parties, and (c) not disclose it to any third party without prior written consent, except to employees and advisors with a need to know who are bound by similar confidentiality obligations.

3. TERM
This Agreement is effective from the date above and remains in effect for two (2) years. Obligations regarding trade secrets continue for as long as they remain trade secrets.

4. NO LICENSE
Nothing in this Agreement grants either Party any rights in the other's Confidential Information except for the limited evaluation purpose above.

5. RETURN OR DESTRUCTION
Upon request, each Party will promptly return or destroy the other's Confidential Information in its possession.

6. NO OBLIGATION
This Agreement does not obligate either Party to enter into any further agreement or business relationship.

7. GOVERNING LAW
This Agreement is governed by the laws of {{jurisdiction}}.

By signing on the Loop platform, each Party agrees to the terms above.

Signed: {{party_a}}  ____________________
Signed: {{party_b}}  ____________________`;

// Loop default services contract. Editable scope/price/terms fields.
export const LOOP_CONTRACT_TEMPLATE = `SERVICES AGREEMENT

This Services Agreement ("Agreement") is between {{party_a}} ("Provider") and {{party_b}} ("Client") effective {{effective_date}}.

1. SCOPE OF SERVICES
{{scope}}

2. DELIVERABLES
{{deliverables}}

3. TIMELINE
{{timeline}}

4. FEES & PAYMENT
Total fee: {{price}}.
Payment terms: {{payment_terms_human}}.
Loop holds payment in escrow under the Loop Marketplace Terms; release follows the Refund Policy below.

5. REFUND POLICY
{{refund_policy_human}}

6. INTELLECTUAL PROPERTY
All deliverables created specifically for this engagement transfer to the Client upon full payment. Provider retains rights to general know-how, methods, and pre-existing tools.

7. CONFIDENTIALITY
Each Party will keep the other's non-public information confidential as set out in any separate NDA between the Parties, or, absent such an NDA, for a period of two (2) years from the date above.

8. INDEPENDENT CONTRACTOR
Provider is an independent contractor, not an employee, partner, or agent of Client.

9. TERMINATION
Either Party may terminate this Agreement for material breach if the breach is not cured within seven (7) days of written notice. Refunds on termination follow the Refund Policy above.

10. GOVERNING LAW
This Agreement is governed by the laws of {{jurisdiction}}.

By signing on the Loop platform, both Parties agree to the terms above.

Signed: {{party_a}} (Provider)  ____________________
Signed: {{party_b}} (Client)    ____________________`;

const PAYMENT_TERMS_HUMAN: Record<ContractFields["payment_terms"], string> = {
  on_signing: "Full payment due on signing.",
  on_delivery: "Full payment due on delivery and Client's acceptance.",
  milestones: "Payment by milestones as separately agreed in the engagement.",
};

const REFUND_POLICY_HUMAN: Record<ContractFields["refund_policy"], string> = {
  non_refundable: "All payments are NON-REFUNDABLE once work has begun.",
  refund_until_start:
    "Full refund if cancelled before Provider begins work. Once work begins, payments are non-refundable.",
  pro_rata_refund:
    "Pro-rata refund based on uncompleted work if either party cancels in writing before final delivery.",
};

export function renderTemplate(
  template: string,
  partyA: string,
  partyB: string,
  fields?: Partial<ContractFields>,
): string {
  const f = { ...DEFAULT_CONTRACT_FIELDS, ...(fields ?? {}) };
  return template
    .replaceAll("{{party_a}}", partyA || "Party A")
    .replaceAll("{{party_b}}", partyB || "Party B")
    .replaceAll("{{effective_date}}", f.effective_date)
    .replaceAll("{{scope}}", f.scope || "_To be filled in._")
    .replaceAll("{{deliverables}}", f.deliverables || "_To be filled in._")
    .replaceAll("{{timeline}}", f.timeline || "_To be filled in._")
    .replaceAll("{{price}}", f.price || "_To be filled in._")
    .replaceAll(
      "{{payment_terms_human}}",
      PAYMENT_TERMS_HUMAN[f.payment_terms],
    )
    .replaceAll(
      "{{refund_policy_human}}",
      REFUND_POLICY_HUMAN[f.refund_policy],
    )
    .replaceAll("{{jurisdiction}}", f.jurisdiction);
}

export const PAYMENT_TERMS_OPTIONS: Array<{
  value: ContractFields["payment_terms"];
  label: string;
}> = [
  { value: "on_signing", label: "Full payment on signing" },
  { value: "on_delivery", label: "Full payment on delivery" },
  { value: "milestones", label: "Milestones (separate agreement)" },
];

export const REFUND_POLICY_OPTIONS: Array<{
  value: ContractFields["refund_policy"];
  label: string;
}> = [
  { value: "non_refundable", label: "Non-refundable" },
  { value: "refund_until_start", label: "Refundable until work begins" },
  { value: "pro_rata_refund", label: "Pro-rata refund" },
];
