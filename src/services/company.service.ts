import prisma from '../config/database';

interface UpdateCompanyDTO {
  name?: string;
  nit?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
}

export class CompanyService {
  /** Obtiene el perfil de la empresa (crea uno por defecto si no existe) */
  async getProfile() {
    let company = await prisma.company.findUnique({ where: { id: 1 } });
    if (!company) {
      company = await prisma.company.create({
        data: { id: 1, name: 'Mi Empresa de Herrajes' },
      });
    }
    return company;
  }

  /** Actualiza el perfil de la empresa */
  async updateProfile(data: UpdateCompanyDTO) {
    // Asegurarse de que existe
    await this.getProfile();
    return prisma.company.update({
      where: { id: 1 },
      data,
    });
  }
}

export default new CompanyService();
