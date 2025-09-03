import React, { useEffect, useRef } from 'react';
import { Modal, Pressable, ScrollView, View, Animated, PanResponder, Dimensions, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number; // Percentage of screen height (0-1)
  title?: string;
}

export default function BottomSheet({ 
  visible, 
  onClose, 
  children, 
  height = 0.6,
  title 
}: BottomSheetProps) {
  const { colors } = useTheme();
  const sheetInitialY = Math.round(Dimensions.get('window').height * (1 - height));
  const sheetTranslateY = useRef(new Animated.Value(sheetInitialY)).current;

  useEffect(() => {
    if (visible) {
      sheetTranslateY.setValue(sheetInitialY);
      Animated.timing(sheetTranslateY, { 
        toValue: 0, 
        duration: 220, 
        useNativeDriver: true 
      }).start();
    }
  }, [visible, sheetInitialY, sheetTranslateY]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
    onPanResponderMove: (_e, g) => { 
      if (g.dy > 0) sheetTranslateY.setValue(g.dy); 
    },
    onPanResponderRelease: (_e, g) => {
      if (g.dy > 120) {
        Animated.timing(sheetTranslateY, { 
          toValue: sheetInitialY, 
          duration: 180, 
          useNativeDriver: true 
        }).start(() => onClose());
      } else {
        Animated.timing(sheetTranslateY, { 
          toValue: 0, 
          duration: 160, 
          useNativeDriver: true 
        }).start();
      }
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <Pressable
        style={styles.modalBackdrop}
        onPress={() => {
          Animated.timing(sheetTranslateY, { 
            toValue: sheetInitialY, 
            duration: 180, 
            useNativeDriver: true 
          }).start(() => onClose());
        }}
      >
        <Animated.View
          style={[
            styles.modalSheetBottom,
            { 
              backgroundColor: colors.card, 
              borderColor: colors.border, 
              transform: [{ translateY: sheetTranslateY }],
              height: `${height * 100}%`
            },
          ]}
        >
          <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          </View>
          
          {title && (
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            </View>
          )}
          
          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    padding: 0, 
    backgroundColor: 'rgba(0,0,0,0.4)' 
  },
  modalSheetBottom: { 
    width: '100%', 
    borderTopLeftRadius: 16, 
    borderTopRightRadius: 16, 
    borderWidth: 1, 
    overflow: 'hidden' 
  },
  dragHandleContainer: { 
    alignItems: 'center', 
    paddingVertical: 8 
  },
  dragHandle: { 
    width: 40, 
    height: 4, 
    borderRadius: 2, 
    opacity: 0.7 
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: { 
    flex: 1 
  },
  contentContainer: { 
    paddingVertical: 8, 
    paddingBottom: 16 
  },
});
