import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { Stack } from 'expo-router';

export default function ResponsiveDemoScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [inputValue, setInputValue] = useState('');

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Responsive Layout Demo',
          headerStyle: {
            backgroundColor: '#2B3440',
          },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          isTablet && styles.containerTablet,
        ]}
      >
        <Text style={[styles.title, isTablet && styles.titleTablet]}>
          Responsive Layout Demo
        </Text>

        <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>
          Current screen width: {Math.round(width)}px
          {isTablet ? ' (Tablet)' : ' (Mobile)'}
        </Text>

        <View
          style={[
            styles.contentWrapper,
            isTablet && styles.contentWrapperTablet,
          ]}
        >
          <View style={[styles.section, isTablet && styles.sectionTablet]}>
            <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>
              Sample Section 1
            </Text>
            <Text style={[styles.paragraph, isTablet && styles.paragraphTablet]}>
              This is a sample paragraph demonstrating responsive text sizing
              and spacing. On mobile devices, this content stacks vertically
              with standard padding. On tablets, you'll see increased font
              sizes and more generous spacing for better readability.
            </Text>

            <TextInput
              style={[styles.input, isTablet && styles.inputTablet]}
              placeholder="Enter some text..."
              placeholderTextColor="#999"
              value={inputValue}
              onChangeText={setInputValue}
            />

            <TouchableOpacity
              style={[styles.button, isTablet && styles.buttonTablet]}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, isTablet && styles.buttonTextTablet]}>
                Primary Action Button
              </Text>
            </TouchableOpacity>
          </View>

          {isTablet ? (
            <View style={styles.twoColumnContainer}>
              <View style={[styles.column, styles.columnLeft]}>
                <Text style={[styles.sectionTitle, styles.sectionTitleTablet]}>
                  Column 1
                </Text>
                <Text style={[styles.paragraph, styles.paragraphTablet]}>
                  On tablets, this content appears in a two-column layout. This
                  provides better use of horizontal space and creates a more
                  balanced design.
                </Text>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.buttonTablet]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.secondaryButtonText, styles.buttonTextTablet]}>
                    Column 1 Action
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.column, styles.columnRight]}>
                <Text style={[styles.sectionTitle, styles.sectionTitleTablet]}>
                  Column 2
                </Text>
                <Text style={[styles.paragraph, styles.paragraphTablet]}>
                  The second column sits beside the first, creating a magazine-style
                  layout that's perfect for tablets and larger screens.
                </Text>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.buttonTablet]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.secondaryButtonText, styles.buttonTextTablet]}>
                    Column 2 Action
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Section 2</Text>
                <Text style={styles.paragraph}>
                  On mobile, this content stacks vertically for easier scrolling
                  and better single-column readability.
                </Text>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>
                    Secondary Action
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Section 3</Text>
                <Text style={styles.paragraph}>
                  Each section flows naturally in a single column on mobile devices,
                  making it easy to scan and interact with content.
                </Text>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>
                    Another Action
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={[styles.infoCard, isTablet && styles.infoCardTablet]}>
          <Text style={[styles.infoTitle, isTablet && styles.infoTitleTablet]}>
            Layout Features
          </Text>
          <Text style={[styles.infoBullet, isTablet && styles.infoBulletTablet]}>
            • Automatic detection of screen size
          </Text>
          <Text style={[styles.infoBullet, isTablet && styles.infoBulletTablet]}>
            • Responsive font sizes and spacing
          </Text>
          <Text style={[styles.infoBullet, isTablet && styles.infoBulletTablet]}>
            • Two-column layout on tablets
          </Text>
          <Text style={[styles.infoBullet, isTablet && styles.infoBulletTablet]}>
            • Full-width buttons on mobile
          </Text>
          <Text style={[styles.infoBullet, isTablet && styles.infoBulletTablet]}>
            • Centered content with max width on tablets
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  containerTablet: {
    padding: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2B3440',
    marginBottom: 12,
    textAlign: 'center',
  },
  titleTablet: {
    fontSize: 42,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  subtitleTablet: {
    fontSize: 20,
    marginBottom: 40,
  },
  contentWrapper: {
    width: '100%',
  },
  contentWrapperTablet: {
    maxWidth: 1200,
  },
  section: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTablet: {
    padding: 32,
    marginBottom: 24,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2B3440',
    marginBottom: 12,
  },
  sectionTitleTablet: {
    fontSize: 28,
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  paragraphTablet: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#F5F5F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputTablet: {
    height: 56,
    fontSize: 18,
    marginBottom: 24,
    borderRadius: 12,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4C7D7C',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonTablet: {
    height: 56,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  buttonTextTablet: {
    fontSize: 18,
  },
  secondaryButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4C7D7C',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4C7D7C',
  },
  twoColumnContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 24,
    marginBottom: 24,
  },
  column: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  columnLeft: {},
  columnRight: {},
  infoCard: {
    width: '100%',
    backgroundColor: '#E8F4F3',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#4C7D7C',
    marginTop: 8,
  },
  infoCardTablet: {
    maxWidth: 1200,
    padding: 32,
    borderRadius: 16,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2B3440',
    marginBottom: 12,
  },
  infoTitleTablet: {
    fontSize: 24,
    marginBottom: 16,
  },
  infoBullet: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
    marginBottom: 6,
  },
  infoBulletTablet: {
    fontSize: 17,
    lineHeight: 28,
    marginBottom: 8,
  },
  spacer: {
    height: 40,
  },
});
