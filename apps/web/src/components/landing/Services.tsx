import React from 'react';

const service1ImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBT2UcJwtqppsflGcgbX-MPnIwmfCyD3UgEjbJtGUSblwCSNAUv9YwmP3mOe947-OIKJKW4QHH1Fol6Ah5Pp_yTt7MUSJHrHElshnCkPUKjXAGm7ZhOqqW3UiXBNZqjlihf5LnzJusSZODD7TV0wRXIz1tqSorzOFfE1oitEqmCprdHy7Ql6JKdaaYN-q1kbTVW0ZIPMgvBod0puufukNeFNEwdQ-dDlp1HYd_mKmnGmmaCfVB63J1mi_vxXuzJPn80EaLnHn4Y8A";

const service2ImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuB5V7yRKy_OF8bIBi145vY1CfLA0Ks4P1NZ7gd_yu6YNajy9hPtcnGTmiG24uGpHREJEm4yI0NMROZ8PtqPT94v4JMoWZITsD7cGhS_VnlWxQdD2ENlBEUIiDTt_rzFbytH3js3x6tp2SOlDSOaytfPT9XcmVwmOrO6XoCODg--qC1a5jUpsWka8GO-mCTEzO1rAzsoy95x8VkcJctSlHDaTZO-YCQVkl3v5t_M6cPdpUjHBK2nUKNgsGBJTPGDKk8iQZVOX9C70g";

const service3ImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuAcb2KthPNR0a0DniejLXYxr2JFuZ3dHyP6cLjycWJNlDJ_6BfxWZNevGBfHxZs_dwt3vkJyPLZmeHoMsOFK-c7i6-hslueN_UhbgIFvQW_E-4NgBhRzOteEKrbIQ8NOltQy7t9dbuiB8Vt5LLpng1nzPBZ8DCpOxgBYNm0zuZA7H5gBZyNYh-zR0C3yFB02BK0qW7pTEgZhVGHDqzILgYkpD06pPH6Lvz6oTIGeSqBseqg1Cxk1-n2UOmUqgjZjpYyLoZBTOg0hQ";

interface ServiceItemProps {
  category: string;
  title: string;
  description: string;
  imageUrl: string;
}

const ServiceItem: React.FC<ServiceItemProps> = ({ category, title, description, imageUrl }) => {
  return (
    <div className="p-4">
      <div className="flex items-stretch justify-between gap-4 rounded-lg">
        <div className="flex flex-col gap-1 flex-[2_2_0px]">
          <p className="text-[#4e6397] text-sm font-normal leading-normal">{category}</p>
          <p className="text-[#0e121b] text-base font-bold leading-tight">{title}</p>
          <p className="text-[#4e6397] text-sm font-normal leading-normal">{description}</p>
        </div>
        <div
          className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg flex-1"
          style={{
            backgroundImage: `url("${imageUrl}")`
          }}
        />
      </div>
    </div>
  );
};

interface ServicesProps {
  services?: Array<{
    category: string;
    title: string;
    description: string;
    imageUrl?: string;
  }>;
}

const Services: React.FC<ServicesProps> = ({ services }) => {
  const defaultServices = [
    {
      category: "Revisão de Editais",
      title: "Análise Detalhada",
      description: "Garantimos que seus editais estejam em total conformidade com a legislação vigente, evitando impugnações e atrasos.",
      imageUrl: service1ImageUrl
    },
    {
      category: "Revisão de Termos de Referência",
      title: "Especificações Claras",
      description: "Asseguramos que seus termos de referência sejam claros, precisos e objetivos, facilitando a participação de fornecedores qualificados.",
      imageUrl: service2ImageUrl
    },
    {
      category: "Consultoria Especializada",
      title: "Suporte Contínuo",
      description: "Oferecemos consultoria especializada para auxiliar em todas as etapas do processo licitatório, desde a elaboração até a publicação.",
      imageUrl: service3ImageUrl
    }
  ];

  const servicesToRender = services || defaultServices;

  return (
    <div>
      <h2 className="text-[#0e121b] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
        Nossos Principais Serviços
      </h2>
      {servicesToRender.map((service, index) => (
        <ServiceItem
          key={index}
          category={service.category}
          title={service.title}
          description={service.description}
          imageUrl={service.imageUrl || service1ImageUrl}
        />
      ))}
    </div>
  );
};

export default Services;