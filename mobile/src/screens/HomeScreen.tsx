import React from 'react';
import { Body, Card, Heading, ScreenContainer } from '../components/ui';
import { useAuth } from '../auth/AuthProvider';

export default function HomeScreen() {
  const { user } = useAuth();
  const firstName = (user?.displayName || '').split(' ')[0] || undefined;

  return (
    <ScreenContainer>
      <Card>
        <Heading>
          {firstName ? `Hello ${firstName}` : 'Hello'}
        </Heading>
        <Body>Welcome!</Body>
      </Card>
    </ScreenContainer>
  );
}


