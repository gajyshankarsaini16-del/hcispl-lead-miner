type FullEnrichContact = {
  name: string;
  designation: string;
  department: string;
  businessEmail: string | null;
  businessPhone: string | null;
  linkedin: string | null;
  confidenceScore: number;
  source: string;
};

function titleToDepartment(title: string): string {
  const lower = title.toLowerCase();

  if (
    lower.includes("cto") ||
    lower.includes("it") ||
    lower.includes("technology")
  ) {
    return "IT";
  }

  if (
    lower.includes("hr") ||
    lower.includes("human resources")
  ) {
    return "HR";
  }

  if (lower.includes("admin")) {
    return "Administration";
  }

  if (
    lower.includes("coo") ||
    lower.includes("operating")
  ) {
    return "Operations";
  }

  return "Leadership";
}

async function startEnrichment(
  key: string,
  contacts: Array<{
    firstName: string;
    lastName: string;
    domain?: string | null;
    companyName?: string | null;
    linkedinUrl?: string | null;
  }>
): Promise<string | null> {
  try {
    const response = await fetch(
      "https://app.fullenrich.com/api/v2/contact/enrich/bulk",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `LeadMiner enrichment ${Date.now()}`,
          data: contacts.map((contact) => ({
            first_name: contact.firstName,
            last_name: contact.lastName,
            domain: contact.domain ?? undefined,
            company_name: contact.companyName ?? undefined,
            linkedin_url: contact.linkedinUrl ?? undefined,
            enrich_fields: [
              "contact.work_emails",
              "contact.phones",
            ],
          })),
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return data?.enrichment_id ?? data?.id ?? null;
  } catch {
    return null;
  }
}

async function pollResult(
  key: string,
  enrichmentId: string,
  maxTries = 3,
  delayMs = 1500
): Promise<unknown[] | null> {
  for (let i = 0; i < maxTries; i++) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    try {
      const response = await fetch(
        `https://app.fullenrich.com/api/v2/bulk/${enrichmentId}`,
        {
          headers: {
            Authorization: `Bearer ${key}`,
          },
        }
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      if (
        data?.status === "FINISHED" ||
        data?.status === "completed"
      ) {
        return data?.contacts ?? data?.results ?? [];
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function enrichContactsFromFullEnrich(input: {
  companyName: string;
  domain?: string | null;
  contacts: Array<{
    name: string;
    linkedin?: string | null;
  }>;
}): Promise<FullEnrichContact[]> {
  const key = process.env.FULLENRICH_API_KEY;

  if (!key || input.contacts.length === 0) {
    return [];
  }

  const jobContacts = input.contacts.slice(0, 10).map((contact) => {
    const [firstName, ...rest] = contact.name.trim().split(" ");

    return {
      firstName: firstName || contact.name,
      lastName: rest.join(" ") || "Unknown",
      domain: input.domain,
      companyName: input.companyName,
      linkedinUrl: contact.linkedin,
    };
  });

  const enrichmentId = await startEnrichment(key, jobContacts);

  if (!enrichmentId) {
    return [];
  }

  const results = await pollResult(key, enrichmentId);

  if (!results) {
    return [];
  }

  const output: FullEnrichContact[] = [];

  for (const result of results) {
    const item = result as Record<string, unknown>;
    const contact = (item.contact ?? item) as Record<string, unknown>;

    const emails = (
      contact.work_emails ??
      contact.emails ??
      []
    ) as Array<{ email: string }>;

    const phones = (
      contact.phones ??
      []
    ) as Array<{ number: string }>;

    const name = `${contact.first_name ?? ""} ${
      contact.last_name ?? ""
    }`.trim();

    if (!name) {
      continue;
    }

    const title = String(contact.title ?? "Decision Maker");

    output.push({
      name,
      designation: title,
      department: titleToDepartment(title),
      businessEmail: emails[0]?.email ?? null,
      businessPhone: phones[0]?.number ?? null,
      linkedin: (contact.linkedin_url as string) ?? null,
      confidenceScore: 85,
      source: "FullEnrich API",
    });
  }

  return output;
}