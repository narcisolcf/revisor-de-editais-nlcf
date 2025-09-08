import { z } from 'zod';
import { DomainError } from '../errors/domain.error';

/**
 * Interface para dados do endereço
 */
export interface AddressData {
  street: string;
  number: string;
  complement?: string | undefined;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string | undefined;
}

/**
 * Value Object para Address
 * Garante que o endereço seja válido e imutável
 */
export class Address {
  private readonly _street: string;
  private readonly _number: string;
  private readonly _complement?: string | undefined;
  private readonly _neighborhood: string;
  private readonly _city: string;
  private readonly _state: string;
  private readonly _zipCode: string;
  private readonly _country: string;

  private constructor(data: AddressData) {
    this._street = data.street;
    this._number = data.number;
    this._complement = data.complement;
    this._neighborhood = data.neighborhood;
    this._city = data.city;
    this._state = data.state;
    this._zipCode = data.zipCode;
    this._country = data.country || 'Brasil';
  }

  /**
   * Schema de validação para endereço
   */
  private static readonly schema = z.object({
    street: z.string()
      .min(3, 'Logradouro deve ter pelo menos 3 caracteres')
      .max(100, 'Logradouro não pode ter mais de 100 caracteres'),
    number: z.string()
      .min(1, 'Número é obrigatório')
      .max(10, 'Número não pode ter mais de 10 caracteres'),
    complement: z.string()
      .max(50, 'Complemento não pode ter mais de 50 caracteres')
      .optional(),
    neighborhood: z.string()
      .min(2, 'Bairro deve ter pelo menos 2 caracteres')
      .max(50, 'Bairro não pode ter mais de 50 caracteres'),
    city: z.string()
      .min(2, 'Cidade deve ter pelo menos 2 caracteres')
      .max(50, 'Cidade não pode ter mais de 50 caracteres'),
    state: z.string()
      .length(2, 'Estado deve ter exatamente 2 caracteres')
      .regex(/^[A-Z]{2}$/, 'Estado deve estar em maiúsculas'),
    zipCode: z.string()
      .regex(/^\d{5}-?\d{3}$/, 'CEP deve ter formato 00000-000 ou 00000000'),
    country: z.string()
      .min(2, 'País deve ter pelo menos 2 caracteres')
      .max(50, 'País não pode ter mais de 50 caracteres')
      .optional()
  });

  /**
   * Criar Address a partir de dados
   */
  public static create(data: AddressData): Address {
    try {
      // Normalizar CEP
      const normalizedData = {
        ...data,
        zipCode: data.zipCode.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2'),
        state: data.state.toUpperCase(),
        street: data.street.trim(),
        number: data.number.trim(),
        complement: data.complement?.trim(),
        neighborhood: data.neighborhood.trim(),
        city: data.city.trim(),
        country: data.country?.trim()
      };

      const validatedData = this.schema.parse(normalizedData);
      return new Address(validatedData);
    } catch (error) {
      throw new DomainError(`Endereço inválido: ${JSON.stringify(data)}`);
    }
  }

  /**
   * Obter endereço formatado
   */
  public getFormattedAddress(): string {
    const parts = [
      `${this._street}, ${this._number}`,
      this._complement,
      this._neighborhood,
      `${this._city} - ${this._state}`,
      this._zipCode,
      this._country !== 'Brasil' ? this._country : undefined
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Obter endereço resumido (sem complemento)
   */
  public getShortAddress(): string {
    return `${this._street}, ${this._number} - ${this._neighborhood}, ${this._city}/${this._state}`;
  }

  /**
   * Verificar se é endereço brasileiro
   */
  public isBrazilian(): boolean {
    return this._country === 'Brasil';
  }

  /**
   * Verificar igualdade entre Addresses
   */
  public equals(other: Address): boolean {
    return (
      this._street === other._street &&
      this._number === other._number &&
      this._complement === other._complement &&
      this._neighborhood === other._neighborhood &&
      this._city === other._city &&
      this._state === other._state &&
      this._zipCode === other._zipCode &&
      this._country === other._country
    );
  }

  /**
   * Getters para propriedades
   */
  public get street(): string {
    return this._street;
  }

  public get number(): string {
    return this._number;
  }

  public get complement(): string | undefined {
    return this._complement;
  }

  public get neighborhood(): string {
    return this._neighborhood;
  }

  public get city(): string {
    return this._city;
  }

  public get state(): string {
    return this._state;
  }

  public get zipCode(): string {
    return this._zipCode;
  }

  public get country(): string {
    return this._country;
  }

  /**
   * Converter para objeto
   */
  public toObject(): AddressData {
    return {
      street: this._street,
      number: this._number,
      complement: this._complement,
      neighborhood: this._neighborhood,
      city: this._city,
      state: this._state,
      zipCode: this._zipCode,
      country: this._country
    };
  }

  /**
   * Converter para string
   */
  public toString(): string {
    return this.getFormattedAddress();
  }

  /**
   * Converter para JSON
   */
  public toJSON(): AddressData {
    return this.toObject();
  }
}