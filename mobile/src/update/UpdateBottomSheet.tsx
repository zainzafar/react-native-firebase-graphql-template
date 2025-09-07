import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from '../components';
import BottomSheet from '../components/BottomSheet';

type Props = {
  visible: boolean;
  hard: boolean;
  message?: string | null;
  canSkip?: boolean;
  onUpdate: () => void;
  onLater?: () => void; // only for soft prompts
  onSkip?: () => void; // only for admin users
  onClose?: () => void; // for dismissing the modal
};

export default function UpdateBottomSheet({
  visible,
  hard,
  message,
  canSkip,
  onUpdate,
  onLater,
  onSkip,
  onClose,
}: Props) {
  const { colors } = useTheme();

  const title = hard ? 'Update Required' : 'Update Available';
  const defaultMessage = 'A new version is available.';
  const displayMessage = message || defaultMessage;

  return (
    <BottomSheet
      minHeight={0.5}
      visible={visible}
      onClose={onClose || (() => {})} // Use provided onClose or empty function
      dismissible={!hard}
      autoSize={!hard} // Auto-size for soft prompts
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        
        <Text style={[styles.message, { color: colors.text }]}>
          {displayMessage}
        </Text>

        <View style={styles.buttonContainer}>
          <View style={styles.primaryButtonRow}>
            {!hard && onLater && (
              <Button
                title="Maybe Later"
                onPress={onLater}
                style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
                textColor={colors.text}
              />
            )}
            
            <Button
              title="Update"
              onPress={onUpdate}
              style={[styles.button, styles.primaryButton]}
              textColor={'#ffffff'}
            />
          </View>
          
          {canSkip && onSkip && (
            <Button
              title="Skip (Admin)"
              onPress={onSkip}
              style={[styles.button, styles.skipButton, { borderColor: '#ff6b6b' }]}
              textColor={colors.text}
            />
          )}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    minWidth: 120,
  },
  primaryButton: {
    // Primary button styling handled by Button component
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
});
