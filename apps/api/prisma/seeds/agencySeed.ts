import { PrismaService } from '../../src/database/prisma/prisma.service';
import { AgencyType } from '../../src/generated/prisma/client';

export async function seedAgencies(prisma: PrismaService) {
  console.log('Seeding agencies...');

  const agencies = [
    {
      name: 'Bureau of Fire Protection (BFP) Taguig',
      type: AgencyType.fire,
      contact_info: '0917-123-4567 / (02) 8837-0000',
    },
    {
      name: 'Taguig Rescue (Emergency Medical Services)',
      type: AgencyType.medical,
      contact_info: '1622 (Hotline) / 0919-999-9999',
    },
    {
      name: 'Taguig City Police Station (PNP)',
      type: AgencyType.police,
      contact_info: '(02) 8642-3582',
    },
    {
      name: 'Taguig City DRRMO',
      type: AgencyType.drrmo,
      contact_info: '(02) 8555-5555',
    },
    {
      name: 'Philippine Red Cross - Taguig Branch',
      type: AgencyType.medical,
      contact_info: '143',
    }
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
  // Fetch existing categories
  const categories = await prisma.incidentCategory.findMany();
  
  const bfp = await prisma.agency.findUnique({ where: { name: 'Bureau of Fire Protection (BFP) Taguig' } });
  const drrmo = await prisma.agency.findUnique({ where: { name: 'Taguig City DRRMO' } });
  const ems = await prisma.agency.findUnique({ where: { name: 'Taguig Rescue (Emergency Medical Services)' } });
  const pnp = await prisma.agency.findUnique({ where: { name: 'Taguig City Police Station (PNP)' } });

  const links: any[] = [];

  for (const cat of categories) {
    const name = cat.name.toLowerCase();
    
    if (name.includes('fire')) {
      if (bfp) links.push({ agency_id: bfp.id, incident_category_id: cat.id });
    }
    if (name.includes('medical') || name.includes('accident') || name.includes('injury')) {
      if (ems) links.push({ agency_id: ems.id, incident_category_id: cat.id });
    }
    if (name.includes('crime') || name.includes('assault') || name.includes('security') || name.includes('accident')) {
      if (pnp) links.push({ agency_id: pnp.id, incident_category_id: cat.id });
    }
    if (name.includes('flood') || name.includes('earthquake') || name.includes('disaster') || name.includes('typhoon')) {
      if (drrmo) links.push({ agency_id: drrmo.id, incident_category_id: cat.id });
      // EMS might also be recommended for earthquakes
      if (ems && name.includes('earthquake')) links.push({ agency_id: ems.id, incident_category_id: cat.id });
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
