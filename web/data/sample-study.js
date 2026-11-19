export const codebook = {
  luxury: {
    label: "Perceived luxury",
    description:
      "An explicit impression of premium appearance or gifting appeal.",
  },
  portability: {
    label: "Everyday practicality",
    description: "Size, shape, carrying or opening the pack.",
  },
  refill_clarity: {
    label: "Refill understanding",
    description: "Understanding how the stated refill mechanism works.",
  },
  refill_value: {
    label: "Refill value",
    description: "Perceived usefulness of keeping and refilling the case.",
  },
  value: {
    label: "Value for money",
    description: "An explicit reservation or reason about the stated price.",
  },
  distinctiveness: {
    label: "Distinctiveness",
    description: "Recognising the design as unusual or easy to distinguish.",
  },
};
export const regions = {
  cap: "Cap",
  body: "Body",
  refill: "Refill interface",
  general: "Whole concept",
};
export const concepts = [
  {
    id: "A",
    name: "Sculpt",
    finish: "Brushed champagne",
    description: "A sculptural case with the presence of a keepsake.",
    image: "assets/concept-a.png",
    accent: "#b2a08a",
  },
  {
    id: "B",
    name: "Veil",
    finish: "Satin plum",
    description: "A quiet silhouette, designed around the everyday ritual.",
    image: "assets/concept-b.png",
    accent: "#61454f",
  },
  {
    id: "C",
    name: "Ritual",
    finish: "Tactile ivory",
    description: "A considered shell with a visible refill seam.",
    image: "assets/concept-c.png",
    accent: "#a8a293",
  },
];
const personal = ["B", "B", "B", "C", "A", "B", "C", "B", "A", "C", "B", "A"];
const gift = ["A", "A", "A", "A", "A", "C", "C", "A", "B", "C", "A", "B"];
const remarks = {
  A: [
    [
      "The rounded cap looks like a small object I would keep on my dressing table.",
      "luxury",
      "cap",
      "positive",
    ],
    [
      "Le métal et les courbes donnent une impression de cadeau soigné.",
      "luxury",
      "body",
      "positive",
    ],
    [
      "Beautiful to give, but the broad shape looks bulky for my small bag.",
      "portability",
      "body",
      "concern",
    ],
    [
      "Je le trouve élégant, mais je ne vois pas où ouvrir la recharge.",
      "refill_clarity",
      "refill",
      "concern",
    ],
    [
      "The finish feels special enough to leave on display.",
      "luxury",
      "body",
      "positive",
    ],
    [
      "I understand it is refillable from the concept description, not from the case itself.",
      "refill_clarity",
      "refill",
      "concern",
    ],
    [
      "Le capuchon paraît agréable à saisir, même si je voudrais le tester en main.",
      "portability",
      "cap",
      "positive",
    ],
    [
      "For a gift I like its substantial shape; for myself I prefer something slimmer.",
      "portability",
      "body",
      "mixed",
    ],
    [
      "I would keep this case and buy the refill if the shade suits me.",
      "refill_value",
      "refill",
      "positive",
    ],
    [
      "À ce prix, je voudrais être sûre que la recharge coûte moins cher.",
      "value",
      "general",
      "concern",
    ],
    [
      "The sculpted cap makes it easy to recognise beside my other makeup.",
      "distinctiveness",
      "cap",
      "positive",
    ],
    [
      "Le format me plaît pour offrir, moins pour le glisser dans une poche.",
      "portability",
      "body",
      "mixed",
    ],
  ],
  B: [
    [
      "The slim case looks easy to carry every day.",
      "portability",
      "body",
      "positive",
    ],
    [
      "Le format fin semble pratique pour mon petit sac.",
      "portability",
      "body",
      "positive",
    ],
    [
      "The dark satin finish is understated, which I like for myself.",
      "luxury",
      "body",
      "positive",
    ],
    [
      "I might overlook this on a shelf because the shape is familiar.",
      "distinctiveness",
      "body",
      "concern",
    ],
    [
      "Je ne comprends pas où se sépare la recharge du tube.",
      "refill_clarity",
      "refill",
      "concern",
    ],
    [
      "I would need a simple diagram to see how to replace the refill.",
      "refill_clarity",
      "refill",
      "concern",
    ],
    [
      "La couleur prune me plaît, mais pour un cadeau je cherche plus de présence.",
      "luxury",
      "body",
      "mixed",
    ],
    [
      "Its discreet cap and small footprint fit my daily routine.",
      "portability",
      "cap",
      "positive",
    ],
    [
      "I like that it does not look overdecorated. I would give it to a minimalist friend.",
      "luxury",
      "body",
      "positive",
    ],
    [
      "The concept mentions a refill, but the price of that refill is missing.",
      "value",
      "general",
      "concern",
    ],
    [
      "Ce tube ressemble aux autres; la teinte mate lui donne un peu de caractère.",
      "distinctiveness",
      "body",
      "mixed",
    ],
    [
      "A case I could keep for years is more appealing than replacing the whole thing.",
      "refill_value",
      "refill",
      "positive",
    ],
  ],
  C: [
    [
      "The fine seam suggests where the refill opens.",
      "refill_clarity",
      "refill",
      "positive",
    ],
    [
      "La ligne du mécanisme aide à comprendre que la coque se garde.",
      "refill_clarity",
      "refill",
      "positive",
    ],
    [
      "The ivory finish feels calm and less decorative.",
      "luxury",
      "body",
      "positive",
    ],
    [
      "I like the idea of keeping the outer case when the colour is finished.",
      "refill_value",
      "refill",
      "positive",
    ],
    [
      "Le blanc paraît délicat; je me demande si la coque marquera dans mon sac.",
      "portability",
      "body",
      "concern",
    ],
    [
      "I can see the refill seam, but I still need instructions to know which part moves.",
      "refill_clarity",
      "refill",
      "mixed",
    ],
    [
      "The clean shape would suit my own makeup bag.",
      "portability",
      "body",
      "positive",
    ],
    [
      "J’aimerais savoir si la fermeture reste solide après plusieurs recharges.",
      "portability",
      "cap",
      "concern",
    ],
    [
      "This is less striking as a gift, but the refill detail is easier to understand.",
      "refill_clarity",
      "refill",
      "positive",
    ],
    [
      "Keeping the shell matters to me if refills remain available.",
      "refill_value",
      "refill",
      "positive",
    ],
    [
      "La petite ligne est discrète; je ne l’aurais pas comprise sans le texte.",
      "refill_clarity",
      "refill",
      "concern",
    ],
    [
      "The matte ivory looks different from the usual metallic lipstick case.",
      "distinctiveness",
      "body",
      "positive",
    ],
  ],
};
const first = {
  A: [
    "The shape has the presence of a gift.",
    "La forme paraît travaillée et décorative.",
    "The broad cap is visually distinctive.",
  ],
  B: [
    "A quiet design that looks compact.",
    "Le fini prune est discret et élégant.",
    "The slim silhouette looks familiar.",
  ],
  C: [
    "The seam is the first detail I notice.",
    "La coque ivoire est sobre.",
    "The surface looks tactile in the render.",
  ],
};
const choiceReasons = {
  personal: {
    A: "I would choose Sculpt for myself because I enjoy the decorative case.",
    B: "I would choose Veil for myself because its quiet, slim shape fits my routine.",
    C: "I would choose Ritual for myself because keeping the outer case appeals to me.",
  },
  gift: {
    A: "I would give Sculpt because the sculptural finish feels like a special object.",
    B: "I would give Veil to someone who prefers an understated, compact design.",
    C: "I would give Ritual to someone who values keeping and refilling a case.",
  },
};
export function createSampleStudy() {
  const participants = personal.map((_, i) => ({
    id: "P" + String(i + 1).padStart(2, "0"),
    language: i % 3 === 1 ? "fr" : "en",
    routine: i % 3 === 0 ? "Occasional" : "Frequent",
  }));
  const responses = [];
  const choices = [];
  for (const [i, p] of participants.entries()) {
    for (const c of concepts) {
      const [text, theme, region, stance] = remarks[c.id][i];
      responses.push({
        id: "R" + String(responses.length + 1).padStart(3, "0"),
        participant: p.id,
        concept: c.id,
        question: "first_impression",
        context: "general",
        phase: "pack",
        language: p.language,
        text: first[c.id][i % 3],
        codes: {
          A: [["luxury"], ["luxury"], ["distinctiveness"]],
          B: [["portability"], ["luxury"], ["distinctiveness"]],
          C: [["distinctiveness"], [], []],
        }[c.id][i % 3],
        region: "body",
        stance: "neutral",
        status: "authored",
      });
      responses.push({
        id: "R" + String(responses.length + 1).padStart(3, "0"),
        participant: p.id,
        concept: c.id,
        question: "reaction",
        context: "general",
        phase: "concept",
        language: /[Ààéèêîôùûçœ]/.test(text) ? "fr" : "en",
        text,
        codes: [theme],
        region,
        stance,
        status: "authored",
      });
    }
    for (const context of ["personal", "gift"]) {
      const concept = (context === "personal" ? personal : gift)[i];
      const id = "R" + String(responses.length + 1).padStart(3, "0");
      responses.push({
        id,
        participant: p.id,
        concept,
        question: "choice_reason",
        context,
        phase: "concept",
        language: "en",
        text: choiceReasons[context][concept],
        codes:
          concept === "C"
            ? ["refill_value"]
            : concept === "A"
              ? ["luxury"]
              : context === "personal"
                ? ["portability"]
                : ["luxury", "portability"],
        region: "general",
        stance: "positive",
        status: "authored",
      });
      choices.push({ participant: p.id, context, concept, responseId: id });
    }
  }
  for (const [i, r] of responses.entries())
    r.source = { sheet: "Responses", row: i + 2 };
  return {
    id: "beauty-01",
    title: "The lip-colour study",
    description: "Three refillable cases. One formula. Two occasions.",
    synthetic: true,
    version: "1.0",
    concepts: structuredClone(concepts),
    participants,
    responses,
    choices,
    meta: {
      formula: "Same formula and berry-nude shade",
      price: "Same stated price",
      refill: "All three cases are refillable",
      analysis: "Researcher-authored sample coding",
      source: "Original synthetic dataset; no consumer fieldwork",
    },
  };
}
