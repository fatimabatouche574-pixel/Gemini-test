export enum Gender {
  MALE = '男',
  FEMALE = '女',
  NON_BINARY = '非二元'
}

export interface Attributes {
  health: number;
  happiness: number;
  intelligence: number;
  looks: number;
  wealth: number;
}

export interface LifeEvent {
  id: string;
  age: number;
  title: string;
  description: string;
  type: 'neutral' | 'positive' | 'negative' | 'choice';
  impact?: Partial<Attributes>;
  choices?: Choice[];
}

export interface Choice {
  id: string;
  text: string;
  outcomeDescription: string;
  impact: Partial<Attributes>;
}

export interface GameState {
  name: string;
  gender: Gender;
  age: number;
  attributes: Attributes;
  logs: LifeEvent[];
  isGameOver: boolean;
  deathReason?: string;
  currentChoiceEvent?: LifeEvent;
}
