import { forwardRef } from 'react';
import type { ComponentProps } from 'react';

import { theme } from './theme';
import { View } from './View';

type CardProps = ComponentProps<typeof View>;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, ...props }, ref) => {
    return (
      <View
        {...props}
        ref={ref}
        style={{
          marginTop: 15,
          marginLeft: 5,
          marginRight: 5,
          borderRadius: 14,
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
          borderWidth: 1,
          borderStyle: 'solid',
          boxShadow:
            '0 1px 3px rgba(28, 25, 23, 0.04), 0 6px 18px -2px rgba(28, 25, 23, 0.04)',
          ...props.style,
        }}
      >
        <View
          style={{
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          {children}
        </View>
      </View>
    );
  },
);

Card.displayName = 'Card';
