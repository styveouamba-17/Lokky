// phosphor-react-native est importé icône par icône depuis ses sources (.tsx), que TypeScript
// vérifie donc. Ses sources passent `className` à <Svg> (prop web) : on la déclare ici.
import 'react-native-svg';

declare module 'react-native-svg' {
  interface SvgProps {
    className?: string;
  }
}
