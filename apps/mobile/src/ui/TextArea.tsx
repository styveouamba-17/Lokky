import { Input, type InputProps } from './Input';

export type TextAreaProps = Omit<InputProps, 'multiline' | 'showCounter'> & { maxLength: number };

export function TextArea(props: TextAreaProps) {
  return <Input {...props} multiline showCounter />;
}
