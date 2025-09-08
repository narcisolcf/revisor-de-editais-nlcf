import { DomainError } from '../errors/domain.error';

/**
 * Value Object para Phone
 * Garante que o telefone seja válido e imutável
 */
export class Phone {
  private readonly _value: string;
  private readonly _countryCode: string;
  private readonly _areaCode: string;
  private readonly _number: string;

  private constructor(value: string, countryCode: string, areaCode: string, number: string) {
    this._value = value;
    this._countryCode = countryCode;
    this._areaCode = areaCode;
    this._number = number;
  }

  /**
   * Criar Phone a partir de string
   * Aceita formatos: +5511999999999, 11999999999, (11) 99999-9999, etc.
   */
  public static create(value: string): Phone {
    const cleanValue = value.replace(/\D/g, ''); // Remove tudo que não é dígito
    
    // Validação básica
    if (cleanValue.length < 10 || cleanValue.length > 13) {
      throw new DomainError(`Telefone deve ter entre 10 e 13 dígitos: ${value}`);
    }

    let countryCode = '55'; // Brasil por padrão
    let phoneNumber = cleanValue;

    // Se tem código do país
    if (cleanValue.length >= 12) {
      countryCode = cleanValue.substring(0, cleanValue.length - 10);
      phoneNumber = cleanValue.substring(cleanValue.length - 10);
    }

    // Validar se é número brasileiro
    if (countryCode === '55' && phoneNumber.length !== 10 && phoneNumber.length !== 11) {
      throw new DomainError(`Telefone brasileiro deve ter 10 ou 11 dígitos: ${value}`);
    }

    const areaCode = phoneNumber.substring(0, 2);
    const number = phoneNumber.substring(2);

    // Validar código de área brasileiro
    if (countryCode === '55') {
      const validAreaCodes = [
        '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
        '21', '22', '24', // RJ
        '27', '28', // ES
        '31', '32', '33', '34', '35', '37', '38', // MG
        '41', '42', '43', '44', '45', '46', // PR
        '47', '48', '49', // SC
        '51', '53', '54', '55', // RS
        '61', // DF
        '62', '64', // GO
        '63', // TO
        '65', '66', // MT
        '67', // MS
        '68', // AC
        '69', // RO
        '71', '73', '74', '75', '77', // BA
        '79', // SE
        '81', '87', // PE
        '82', // AL
        '83', // PB
        '84', // RN
        '85', '88', // CE
        '86', '89', // PI
        '91', '93', '94', // PA
        '92', '97', // AM
        '95', // RR
        '96', // AP
        '98', '99' // MA
      ];

      if (!validAreaCodes.includes(areaCode)) {
        throw new DomainError(`Código de área inválido: ${areaCode}`);
      }

      // Validar se celular tem 9 dígitos
      if (number.length === 9 && !number.startsWith('9')) {
        throw new DomainError(`Celular deve começar com 9: ${value}`);
      }
    }

    const formattedValue = `+${countryCode}${areaCode}${number}`;
    
    return new Phone(formattedValue, countryCode, areaCode, number);
  }

  /**
   * Verificar se é celular
   */
  public isMobile(): boolean {
    return this._number.length === 9 && this._number.startsWith('9');
  }

  /**
   * Verificar se é telefone fixo
   */
  public isLandline(): boolean {
    return this._number.length === 8;
  }

  /**
   * Obter formato brasileiro
   */
  public toBrazilianFormat(): string {
    if (this._countryCode !== '55') {
      return this._value;
    }

    if (this.isMobile()) {
      return `(${this._areaCode}) ${this._number.substring(0, 5)}-${this._number.substring(5)}`;
    } else {
      return `(${this._areaCode}) ${this._number.substring(0, 4)}-${this._number.substring(4)}`;
    }
  }

  /**
   * Obter formato internacional
   */
  public toInternationalFormat(): string {
    return this._value;
  }

  /**
   * Verificar igualdade entre Phones
   */
  public equals(other: Phone): boolean {
    return this._value === other._value;
  }

  /**
   * Obter valor do telefone
   */
  public get value(): string {
    return this._value;
  }

  /**
   * Obter código do país
   */
  public get countryCode(): string {
    return this._countryCode;
  }

  /**
   * Obter código de área
   */
  public get areaCode(): string {
    return this._areaCode;
  }

  /**
   * Obter número
   */
  public get number(): string {
    return this._number;
  }

  /**
   * Converter para string
   */
  public toString(): string {
    return this._value;
  }

  /**
   * Converter para JSON
   */
  public toJSON(): string {
    return this._value;
  }
}