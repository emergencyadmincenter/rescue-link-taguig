import { PrismaService } from '../../src/database/prisma/prisma.service';
import { AgencyType } from '../../src/generated/prisma/client';

export async function seedAgencies(prisma: PrismaService) {
  console.log('Seeding agencies...');

  // Clear existing agencies to prevent duplicates from old Taguig-specific seed
  await prisma.agency.deleteMany({});

  const agencies = [
    {
      name: 'Bureau of Fire Protection (BFP)',
      type: AgencyType.fire,
      contact_info: null,
    },
    {
      name: 'Emergency Medical Services (EMS)',
      type: AgencyType.medical,
      contact_info: null,
    },
    {
      name: 'Philippine National Police (PNP)',
      type: AgencyType.police,
      contact_info: null,
    },
    {
      name: 'Local DRRMO (Disaster Risk Reduction and Management Office)',
      type: AgencyType.drrmo,
      contact_info: null,
    },
    {
      name: 'Philippine Red Cross',
      type: AgencyType.medical,
      contact_info: null,
    },
    {
      name: 'Department of Social Welfare and Development (DSWD)',
      type: AgencyType.drrmo,
      contact_info: null,
    },
    {
      name: 'Philippine Coast Guard (PCG)',
      type: AgencyType.other,
      contact_info: null,
    },
    {
      name: 'Department of Public Works and Highways (DPWH)',
      type: AgencyType.other,
      contact_info: null,
    },
    {
      name: 'Local Traffic Management Office',
      type: AgencyType.police,
      contact_info: null,
    },
    {
      name: 'Local Barangay',
      type: AgencyType.other,
      contact_info: null,
    },
    {
      name: 'Health Center',
      type: AgencyType.medical,
      contact_info: null,
    },
  ];

  for (const agency of agencies) {
    await prisma.agency.upsert({
      where: { name: agency.name },
      update: {},
      create: {
        name: agency.name,
        type: agency.type as AgencyType,
        contact_info: agency.contact_info,
        is_active: true,
      },
    });
  }

  // Link incident categories to agencies
  const categories = await prisma.incidentCategory.findMany();

  const bfp = await prisma.agency.findUnique({
    where: { name: 'Bureau of Fire Protection (BFP)' },
  });
  const drrmo = await prisma.agency.findUnique({
    where: {
      name: 'Local DRRMO (Disaster Risk Reduction and Management Office)',
    },
  });
  const ems = await prisma.agency.findUnique({
    where: { name: 'Emergency Medical Services (EMS)' },
  });
  const pnp = await prisma.agency.findUnique({
    where: { name: 'Philippine National Police (PNP)' },
  });

  const links: any[] = [];

  for (const cat of categories) {
    const name = cat.name.toLowerCase();

    if (name.includes('fire')) {
      if (bfp) links.push({ agency_id: bfp.id, incident_category_id: cat.id });
    }
    if (
      name.includes('medical') ||
      name.includes('accident') ||
      name.includes('injury')
    ) {
      if (ems) links.push({ agency_id: ems.id, incident_category_id: cat.id });
    }
    if (
      name.includes('crime') ||
      name.includes('assault') ||
      name.includes('security') ||
      name.includes('accident')
    ) {
      if (pnp) links.push({ agency_id: pnp.id, incident_category_id: cat.id });
    }
    if (
      name.includes('flood') ||
      name.includes('earthquake') ||
      name.includes('disaster') ||
      name.includes('typhoon')
    ) {
      if (drrmo)
        links.push({ agency_id: drrmo.id, incident_category_id: cat.id });
      if (ems && name.includes('earthquake'))
        links.push({ agency_id: ems.id, incident_category_id: cat.id });
    }
  }

  for (const link of links) {
    await prisma.agencyIncidentCategory.upsert({
      where: {
        agency_id_incident_category_id: {
          agency_id: link.agency_id,
          incident_category_id: link.incident_category_id,
        },
      },
      update: {},
      create: link,
    });
  }

  console.log('Agencies seeded successfully.');
}
