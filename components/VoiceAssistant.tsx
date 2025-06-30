import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, MicOff, Volume2, Languages, X, CheckCircle, AlertCircle } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { useApp } from '@/contexts/AppContext';

interface VoiceAssistantProps {
  visible: boolean;
  onClose: () => void;
}

interface VoiceCommand {
  type: 'order' | 'expense' | 'deposit' | 'charging';
  data: any;
  confidence: number;
}

export default function VoiceAssistant({ visible, onClose }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);

  const { addToCart, products } = useApp();

  const startListening = async () => {
    if (Platform.OS === 'web') {
      // Web Speech API for web platform
      startWebSpeechRecognition();
    } else {
      // For mobile platforms, we'll simulate voice input for demo
      simulateVoiceInput();
    }
  };

  const startWebSpeechRecognition = () => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      Alert.alert('Not Supported', 'Speech recognition is not supported in this browser. Using demo mode.');
      simulateVoiceInput();
      return;
    }

    const recognition = new SpeechRecognition();
    
    recognition.lang = language === 'ne' ? 'ne-NP' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
        processVoiceCommand(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      Alert.alert('Error', 'Speech recognition failed. Using demo mode.');
      simulateVoiceInput();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      simulateVoiceInput();
    }
  };

  const simulateVoiceInput = () => {
    setIsListening(true);
    setTranscript('');

    // Simulate listening for 2 seconds
    setTimeout(() => {
      const sampleCommands = language === 'ne' ? [
        'दुई कप चिया अर्डर गर्नुहोस्',
        'पाँच सय रुपैयाँ खर्च भयो बिजुली बिलमा',
        'एक हजार रुपैयाँ जम्मा गरियो फोनपेबाट',
        'चार्जिङ सुरु गर्नुहोस् ५० देखि ८० प्रतिशत'
      ] : [
        'Order two cups of tea',
        'Add expense of 500 rupees for electricity',
        'Record deposit of 1000 rupees via Fonepay',
        'Start charging from 50 to 80 percent'
      ];

      const randomCommand = sampleCommands[Math.floor(Math.random() * sampleCommands.length)];
      setTranscript(randomCommand);
      setIsListening(false);
      processVoiceCommand(randomCommand);
    }, 2000);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const processVoiceCommand = async (text: string) => {
    setIsProcessing(true);
    
    try {
      const command = await parseVoiceCommand(text);
      if (command) {
        setLastCommand(command);
        await executeCommand(command);
        speakResponse(command);
      } else {
        const errorMsg = language === 'ne' 
          ? 'माफ गर्नुहोस्, मैले बुझिन। कृपया फेरि प्रयास गर्नुहोस्।'
          : 'Sorry, I didn\'t understand that. Please try again.';
        speakResponse(null, errorMsg);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorMsg = language === 'ne'
        ? 'त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस्।'
        : 'An error occurred. Please try again.';
      speakResponse(null, errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseVoiceCommand = async (text: string): Promise<VoiceCommand | null> => {
    const lowerText = text.toLowerCase();
    
    // Order patterns
    const orderPatterns = language === 'ne' ? [
      /(\d+)\s*(कप|गिलास)?\s*(चिया|कफी|दूध)/,
      /(\d+)\s*(वटा)?\s*(स्यान्डविच|बर्गर|खाना)/,
      /(अर्डर|मागेको)\s*(.+)/
    ] : [
      /(\d+)\s*(cups?|glasses?)?\s*(tea|coffee|milk)/,
      /(\d+)\s*(sandwich|burger|food)/,
      /(order|add)\s*(.+)/
    ];

    // Expense patterns
    const expensePatterns = language === 'ne' ? [
      /(\d+)\s*रुपैयाँ?\s*खर्च\s*(.+)/,
      /खर्च\s*(\d+)\s*(.+)/
    ] : [
      /(\d+)\s*rupees?\s*expense\s*(.+)/,
      /expense\s*(\d+)\s*(.+)/,
      /spent\s*(\d+)\s*(.+)/
    ];

    // Deposit patterns
    const depositPatterns = language === 'ne' ? [
      /(\d+)\s*रुपैयाँ?\s*जम्मा\s*(.+)/,
      /जम्मा\s*(\d+)\s*(.+)/
    ] : [
      /(\d+)\s*rupees?\s*deposit\s*(.+)/,
      /deposit\s*(\d+)\s*(.+)/,
      /received\s*(\d+)\s*(.+)/
    ];

    // Charging patterns
    const chargingPatterns = language === 'ne' ? [
      /चार्जिङ\s*(\d+)\s*देखि\s*(\d+)/,
      /(\d+)\s*प्रतिशत\s*देखि\s*(\d+)\s*प्रतिशत/
    ] : [
      /charg(e|ing)\s*(\d+)\s*to\s*(\d+)/,
      /(\d+)\s*percent\s*to\s*(\d+)\s*percent/
    ];

    // Check order patterns
    for (const pattern of orderPatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        return {
          type: 'order',
          data: { text: match[0], quantity: match[1] || '1', item: match[2] || match[3] },
          confidence: 0.8
        };
      }
    }

    // Check expense patterns
    for (const pattern of expensePatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        return {
          type: 'expense',
          data: { amount: match[1], description: match[2] || 'Voice expense' },
          confidence: 0.8
        };
      }
    }

    // Check deposit patterns
    for (const pattern of depositPatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        return {
          type: 'deposit',
          data: { amount: match[1], mode: match[2] || 'Cash' },
          confidence: 0.8
        };
      }
    }

    // Check charging patterns
    for (const pattern of chargingPatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        return {
          type: 'charging',
          data: { start: match[1] || match[2], end: match[2] || match[3] },
          confidence: 0.8
        };
      }
    }

    return null;
  };

  const executeCommand = async (command: VoiceCommand) => {
    switch (command.type) {
      case 'order':
        await handleOrderCommand(command.data);
        break;
      case 'expense':
        await handleExpenseCommand(command.data);
        break;
      case 'deposit':
        await handleDepositCommand(command.data);
        break;
      case 'charging':
        await handleChargingCommand(command.data);
        break;
    }
  };

  const handleOrderCommand = async (data: any) => {
    // Find matching product
    const matchingProduct = products.find(p => 
      p.name.toLowerCase().includes(data.item?.toLowerCase()) ||
      data.item?.toLowerCase().includes(p.name.toLowerCase())
    );

    if (matchingProduct) {
      const quantity = parseInt(data.quantity) || 1;
      for (let i = 0; i < quantity; i++) {
        addToCart(matchingProduct.name, matchingProduct.rate);
      }
    }
  };

  const handleExpenseCommand = async (data: any) => {
    // This would integrate with your expense submission logic
    console.log('Expense command:', data);
  };

  const handleDepositCommand = async (data: any) => {
    // This would integrate with your deposit submission logic
    console.log('Deposit command:', data);
  };

  const handleChargingCommand = async (data: any) => {
    // This would integrate with your charging submission logic
    console.log('Charging command:', data);
  };

  const speakResponse = (command: VoiceCommand | null, customMessage?: string) => {
    let message = customMessage;
    
    if (!message && command) {
      if (language === 'ne') {
        switch (command.type) {
          case 'order':
            message = 'अर्डर थपियो।';
            break;
          case 'expense':
            message = 'खर्च रेकर्ड गरियो।';
            break;
          case 'deposit':
            message = 'जम्मा रेकर्ड गरियो।';
            break;
          case 'charging':
            message = 'चार्जिङ सुरु गरियो।';
            break;
        }
      } else {
        switch (command.type) {
          case 'order':
            message = 'Order added successfully.';
            break;
          case 'expense':
            message = 'Expense recorded successfully.';
            break;
          case 'deposit':
            message = 'Deposit recorded successfully.';
            break;
          case 'charging':
            message = 'Charging started successfully.';
            break;
        }
      }
    }

    if (message && Speech.speak) {
      try {
        Speech.speak(message, {
          language: language === 'ne' ? 'ne-NP' : 'en-US',
          pitch: 1.0,
          rate: 0.8,
        });
      } catch (error) {
        console.log('Speech synthesis not available:', error);
      }
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ne' : 'en');
    const message = language === 'en' 
      ? 'नेपाली भाषामा परिवर्तन गरियो'
      : 'Language changed to English';
    
    if (Speech.speak) {
      try {
        Speech.speak(message, {
          language: language === 'en' ? 'ne-NP' : 'en-US',
        });
      } catch (error) {
        console.log('Speech synthesis not available:', error);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient colors={['#e3f2fd', '#fce4ec']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Mic size={32} color="#1976d2" />
              <View>
                <Text style={styles.title}>
                  {language === 'ne' ? 'आवाज सहायक' : 'Voice Assistant'}
                </Text>
                <Text style={styles.subtitle}>
                  {language === 'ne' ? 'आवाजमार्फत आदेश दिनुहोस्' : 'Give voice commands'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Language Toggle */}
            <TouchableOpacity style={styles.languageButton} onPress={toggleLanguage}>
              <Languages size={20} color="#1976d2" />
              <Text style={styles.languageText}>
                {language === 'ne' ? 'नेपाली' : 'English'}
              </Text>
            </TouchableOpacity>

            {/* Voice Interface */}
            <View style={styles.voiceInterface}>
              <TouchableOpacity
                style={[styles.micButton, isListening && styles.micButtonActive]}
                onPress={isListening ? stopListening : startListening}
                disabled={isProcessing}
              >
                {isListening ? (
                  <MicOff size={48} color="#fff" />
                ) : (
                  <Mic size={48} color="#fff" />
                )}
              </TouchableOpacity>
              
              <Text style={styles.micStatus}>
                {isProcessing 
                  ? (language === 'ne' ? 'प्रक्रिया गर्दै...' : 'Processing...')
                  : isListening 
                    ? (language === 'ne' ? 'सुन्दै...' : 'Listening...')
                    : (language === 'ne' ? 'बोल्न थिच्नुहोस्' : 'Tap to speak')
                }
              </Text>

              {transcript && (
                <View style={styles.transcriptContainer}>
                  <Text style={styles.transcriptLabel}>
                    {language === 'ne' ? 'तपाईंले भन्नुभयो:' : 'You said:'}
                  </Text>
                  <Text style={styles.transcriptText}>{transcript}</Text>
                </View>
              )}

              {lastCommand && (
                <View style={styles.commandResult}>
                  <CheckCircle size={24} color="#4caf50" />
                  <Text style={styles.commandResultText}>
                    {language === 'ne' ? 'आदेश सफल भयो!' : 'Command executed successfully!'}
                  </Text>
                </View>
              )}
            </View>

            {/* Command Examples */}
            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>
                {language === 'ne' ? 'उदाहरण आदेशहरू:' : 'Example Commands:'}
              </Text>
              
              <View style={styles.examplesList}>
                {language === 'ne' ? [
                  '• "दुई कप चिया अर्डर गर्नुहोस्"',
                  '• "पाँच सय रुपैयाँ खर्च भयो बिजुली बिलमा"',
                  '• "एक हजार रुपैयाँ जम्मा गरियो फोनपेबाट"',
                  '• "चार्जिङ सुरु गर्नुहोस् ५० देखि ८० प्रतिशत"'
                ] : [
                  '• "Order two cups of tea"',
                  '• "Add expense of 500 rupees for electricity"',
                  '• "Record deposit of 1000 rupees via Fonepay"',
                  '• "Start charging from 50 to 80 percent"'
                ].map((example, index) => (
                  <Text key={index} style={styles.exampleText}>{example}</Text>
                ))}
              </View>
            </View>

            {/* Features */}
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>
                {language === 'ne' ? 'सुविधाहरू:' : 'Features:'}
              </Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Volume2 size={16} color="#1976d2" />
                  <Text style={styles.featureText}>
                    {language === 'ne' ? 'आवाज प्रतिक्रिया' : 'Voice feedback'}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Languages size={16} color="#1976d2" />
                  <Text style={styles.featureText}>
                    {language === 'ne' ? 'द्विभाषी समर्थन' : 'Bilingual support'}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <CheckCircle size={16} color="#1976d2" />
                  <Text style={styles.featureText}>
                    {language === 'ne' ? 'स्मार्ट पहिचान' : 'Smart recognition'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Demo Notice */}
            <View style={styles.demoNotice}>
              <AlertCircle size={16} color="#ff9800" />
              <Text style={styles.demoNoticeText}>
                {language === 'ne' 
                  ? 'यो डेमो मोड हो। वास्तविक आवाज पहिचानको लागि माइक्रोफोन अनुमति चाहिन्छ।'
                  : 'This is demo mode. Real voice recognition requires microphone permission.'
                }
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'center',
    marginBottom: 32,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  languageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  voiceInterface: {
    alignItems: 'center',
    marginBottom: 32,
  },
  micButton: {
    backgroundColor: '#1976d2',
    borderRadius: 80,
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  micButtonActive: {
    backgroundColor: '#d32f2f',
    transform: [{ scale: 1.1 }],
  },
  micStatus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  transcriptContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  transcriptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  commandResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  commandResultText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
  },
  examplesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  examplesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  examplesList: {
    gap: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  featuresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  demoNoticeText: {
    fontSize: 12,
    color: '#ff9800',
    flex: 1,
    lineHeight: 18,
  },
});