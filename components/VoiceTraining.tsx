import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Brain, 
  X, 
  Mic, 
  MicOff, 
  Plus, 
  Trash2, 
  Play, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Languages,
  Volume2,
  Settings
} from 'lucide-react-native';
import * as Speech from 'expo-speech';

interface VoiceTrainingProps {
  visible: boolean;
  onClose: () => void;
}

interface TrainingCommand {
  id: string;
  phrase: string;
  phraseNe?: string;
  action: 'order' | 'expense' | 'deposit' | 'charging' | 'custom';
  parameters: {
    [key: string]: any;
  };
  examples: string[];
  examplesNe?: string[];
  confidence: number;
  isActive: boolean;
}

interface TrainingSession {
  commandId: string;
  recordings: string[];
  language: 'en' | 'ne';
  status: 'pending' | 'training' | 'completed' | 'failed';
}

export default function VoiceTraining({ visible, onClose }: VoiceTrainingProps) {
  const [commands, setCommands] = useState<TrainingCommand[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<TrainingCommand | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecording, setCurrentRecording] = useState('');
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const [showAddCommand, setShowAddCommand] = useState(false);
  const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null);
  const [isTraining, setIsTraining] = useState(false);

  // New command form state
  const [newCommand, setNewCommand] = useState({
    phrase: '',
    phraseNe: '',
    action: 'order' as TrainingCommand['action'],
    parameters: {},
    examples: [''],
    examplesNe: ['']
  });

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      const stored = localStorage.getItem('voiceTrainingCommands');
      if (stored) {
        setCommands(JSON.parse(stored));
      } else {
        // Initialize with default commands
        const defaultCommands = getDefaultCommands();
        setCommands(defaultCommands);
        saveTrainingData(defaultCommands);
      }
    } catch (error) {
      console.error('Error loading training data:', error);
    }
  };

  const saveTrainingData = async (commandsToSave: TrainingCommand[]) => {
    try {
      localStorage.setItem('voiceTrainingCommands', JSON.stringify(commandsToSave));
    } catch (error) {
      console.error('Error saving training data:', error);
    }
  };

  const getDefaultCommands = (): TrainingCommand[] => [
    {
      id: '1',
      phrase: 'Order {quantity} {item}',
      phraseNe: '{quantity} {item} अर्डर गर्नुहोस्',
      action: 'order',
      parameters: { quantity: 'number', item: 'string' },
      examples: [
        'Order 2 cups of tea',
        'Order one sandwich',
        'Add 3 burgers to cart'
      ],
      examplesNe: [
        'दुई कप चिया अर्डर गर्नुहोस्',
        'एक स्यान्डविच अर्डर गर्नुहोस्',
        'तीन बर्गर कार्टमा थप्नुहोस्'
      ],
      confidence: 0.9,
      isActive: true
    },
    {
      id: '2',
      phrase: 'Add expense of {amount} for {description}',
      phraseNe: '{description} को लागि {amount} खर्च थप्नुहोस्',
      action: 'expense',
      parameters: { amount: 'number', description: 'string' },
      examples: [
        'Add expense of 500 for electricity',
        'Record expense 1000 rupees for rent',
        'Spent 250 on fuel'
      ],
      examplesNe: [
        'बिजुलीको लागि ५०० खर्च थप्नुहोस्',
        'भाडाको लागि १००० रुपैयाँ खर्च रेकर्ड गर्नुहोस्',
        'इन्धनमा २५० खर्च भयो'
      ],
      confidence: 0.85,
      isActive: true
    },
    {
      id: '3',
      phrase: 'Record deposit of {amount} via {method}',
      phraseNe: '{method} मार्फत {amount} जम्मा रेकर्ड गर्नुहोस्',
      action: 'deposit',
      parameters: { amount: 'number', method: 'string' },
      examples: [
        'Record deposit of 1000 via Fonepay',
        'Add deposit 500 rupees cash',
        'Received 2000 through Esewa'
      ],
      examplesNe: [
        'फोनपे मार्फत १००० जम्मा रेकर्ड गर्नुहोस्',
        'नगदमा ५०० रुपैयाँ जम्मा थप्नुहोस्',
        'इसेवा मार्फत २००० प्राप्त भयो'
      ],
      confidence: 0.8,
      isActive: true
    },
    {
      id: '4',
      phrase: 'Start charging from {start} to {end} percent',
      phraseNe: '{start} देखि {end} प्रतिशत चार्जिङ सुरु गर्नुहोस्',
      action: 'charging',
      parameters: { start: 'number', end: 'number' },
      examples: [
        'Start charging from 20 to 80 percent',
        'Charge from 50 to 100 percent',
        'Begin charging 30 to 90 percent'
      ],
      examplesNe: [
        '२० देखि ८० प्रतिशत चार्जिङ सुरु गर्नुहोस्',
        '५० देखि १०० प्रतिशत चार्ज गर्नुहोस्',
        '३० देखि ९० प्रतिशत चार्जिङ सुरु गर्नुहोस्'
      ],
      confidence: 0.85,
      isActive: true
    }
  ];

  const startRecording = () => {
    setIsRecording(true);
    setCurrentRecording('');
    
    // Simulate recording for demo
    setTimeout(() => {
      const samplePhrases = language === 'ne' ? [
        'दुई कप चिया अर्डर गर्नुहोस्',
        'पाँच सय रुपैयाँ खर्च भयो',
        'एक हजार रुपैयाँ जम्मा गरियो'
      ] : [
        'Order two cups of tea',
        'Add expense of five hundred',
        'Record deposit of one thousand'
      ];
      
      const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
      setCurrentRecording(randomPhrase);
      setIsRecording(false);
    }, 2000);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const addRecordingToCommand = () => {
    if (!selectedCommand || !currentRecording.trim()) return;

    const updatedCommands = commands.map(cmd => {
      if (cmd.id === selectedCommand.id) {
        const examples = language === 'ne' ? cmd.examplesNe || [] : cmd.examples;
        const newExamples = [...examples, currentRecording.trim()];
        
        return {
          ...cmd,
          [language === 'ne' ? 'examplesNe' : 'examples']: newExamples
        };
      }
      return cmd;
    });

    setCommands(updatedCommands);
    saveTrainingData(updatedCommands);
    setCurrentRecording('');
    
    Alert.alert(
      language === 'ne' ? 'सफल' : 'Success',
      language === 'ne' ? 'नयाँ उदाहरण थपियो' : 'New example added successfully'
    );
  };

  const trainCommand = async (command: TrainingCommand) => {
    setIsTraining(true);
    setTrainingSession({
      commandId: command.id,
      recordings: [],
      language,
      status: 'training'
    });

    try {
      // Simulate AI training process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update command confidence
      const updatedCommands = commands.map(cmd => {
        if (cmd.id === command.id) {
          return {
            ...cmd,
            confidence: Math.min(0.95, cmd.confidence + 0.05)
          };
        }
        return cmd;
      });

      setCommands(updatedCommands);
      saveTrainingData(updatedCommands);
      
      setTrainingSession(prev => prev ? { ...prev, status: 'completed' } : null);
      
      Alert.alert(
        language === 'ne' ? 'प्रशिक्षण सम्पन्न' : 'Training Complete',
        language === 'ne' ? 'आदेश सफलतापूर्वक प्रशिक्षित भयो' : 'Command trained successfully'
      );
    } catch (error) {
      setTrainingSession(prev => prev ? { ...prev, status: 'failed' } : null);
      Alert.alert(
        language === 'ne' ? 'त्रुटि' : 'Error',
        language === 'ne' ? 'प्रशिक्षणमा समस्या भयो' : 'Training failed'
      );
    } finally {
      setIsTraining(false);
      setTimeout(() => setTrainingSession(null), 2000);
    }
  };

  const addNewCommand = () => {
    if (!newCommand.phrase.trim()) {
      Alert.alert('Error', 'Please enter a command phrase');
      return;
    }

    const command: TrainingCommand = {
      id: Date.now().toString(),
      phrase: newCommand.phrase.trim(),
      phraseNe: newCommand.phraseNe.trim() || undefined,
      action: newCommand.action,
      parameters: newCommand.parameters,
      examples: newCommand.examples.filter(ex => ex.trim()),
      examplesNe: newCommand.examplesNe?.filter(ex => ex.trim()),
      confidence: 0.5,
      isActive: true
    };

    const updatedCommands = [...commands, command];
    setCommands(updatedCommands);
    saveTrainingData(updatedCommands);
    
    // Reset form
    setNewCommand({
      phrase: '',
      phraseNe: '',
      action: 'order',
      parameters: {},
      examples: [''],
      examplesNe: ['']
    });
    
    setShowAddCommand(false);
    Alert.alert('Success', 'New command added successfully');
  };

  const deleteCommand = (commandId: string) => {
    Alert.alert(
      language === 'ne' ? 'आदेश मेटाउनुहोस्' : 'Delete Command',
      language === 'ne' ? 'के तपाईं यो आदेश मेटाउन चाहनुहुन्छ?' : 'Are you sure you want to delete this command?',
      [
        { text: language === 'ne' ? 'रद्द गर्नुहोस्' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ne' ? 'मेटाउनुहोस्' : 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedCommands = commands.filter(cmd => cmd.id !== commandId);
            setCommands(updatedCommands);
            saveTrainingData(updatedCommands);
          }
        }
      ]
    );
  };

  const toggleCommandActive = (commandId: string) => {
    const updatedCommands = commands.map(cmd => {
      if (cmd.id === commandId) {
        return { ...cmd, isActive: !cmd.isActive };
      }
      return cmd;
    });
    setCommands(updatedCommands);
    saveTrainingData(updatedCommands);
  };

  const testCommand = (command: TrainingCommand) => {
    const example = language === 'ne' 
      ? (command.examplesNe?.[0] || command.examples[0])
      : command.examples[0];
    
    if (Speech.speak) {
      try {
        Speech.speak(example, {
          language: language === 'ne' ? 'ne-NP' : 'en-US',
          pitch: 1.0,
          rate: 0.8,
        });
      } catch (error) {
        console.log('Speech synthesis not available:', error);
      }
    }
    
    Alert.alert(
      language === 'ne' ? 'परीक्षण' : 'Test',
      `${language === 'ne' ? 'उदाहरण' : 'Example'}: "${example}"`
    );
  };

  const renderCommandCard = (command: TrainingCommand) => {
    const examples = language === 'ne' ? (command.examplesNe || command.examples) : command.examples;
    const phrase = language === 'ne' ? (command.phraseNe || command.phrase) : command.phrase;
    
    return (
      <View key={command.id} style={[styles.commandCard, !command.isActive && styles.commandCardInactive]}>
        <View style={styles.commandHeader}>
          <View style={styles.commandInfo}>
            <Text style={styles.commandPhrase}>{phrase}</Text>
            <Text style={styles.commandAction}>{command.action.toUpperCase()}</Text>
          </View>
          <View style={styles.commandActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.testButton]}
              onPress={() => testCommand(command)}
            >
              <Play size={16} color="#1976d2" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.trainButton]}
              onPress={() => trainCommand(command)}
              disabled={isTraining}
            >
              <Brain size={16} color="#4caf50" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => deleteCommand(command.id)}
            >
              <Trash2 size={16} color="#f44336" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>
            {language === 'ne' ? 'विश्वसनीयता' : 'Confidence'}:
          </Text>
          <View style={styles.confidenceBar}>
            <View 
              style={[
                styles.confidenceFill, 
                { width: `${command.confidence * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.confidenceText}>{Math.round(command.confidence * 100)}%</Text>
        </View>

        <View style={styles.examplesContainer}>
          <Text style={styles.examplesTitle}>
            {language === 'ne' ? 'उदाहरणहरू' : 'Examples'}:
          </Text>
          {examples.slice(0, 2).map((example, index) => (
            <Text key={index} style={styles.exampleText}>• {example}</Text>
          ))}
          {examples.length > 2 && (
            <Text style={styles.moreExamples}>
              +{examples.length - 2} {language === 'ne' ? 'थप' : 'more'}
            </Text>
          )}
        </View>

        <View style={styles.commandFooter}>
          <TouchableOpacity
            style={[styles.toggleButton, command.isActive && styles.toggleButtonActive]}
            onPress={() => toggleCommandActive(command.id)}
          >
            <Text style={[styles.toggleButtonText, command.isActive && styles.toggleButtonTextActive]}>
              {command.isActive 
                ? (language === 'ne' ? 'सक्रिय' : 'Active')
                : (language === 'ne' ? 'निष्क्रिय' : 'Inactive')
              }
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setSelectedCommand(command)}
          >
            <Text style={styles.selectButtonText}>
              {language === 'ne' ? 'प्रशिक्षण दिनुहोस्' : 'Train'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
              <Brain size={32} color="#1976d2" />
              <View>
                <Text style={styles.title}>
                  {language === 'ne' ? 'आवाज प्रशिक्षण' : 'Voice Training'}
                </Text>
                <Text style={styles.subtitle}>
                  {language === 'ne' ? 'AI बोटलाई प्रशिक्षण दिनुहोस्' : 'Train your AI bot'}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => setLanguage(prev => prev === 'en' ? 'ne' : 'en')}
              >
                <Languages size={20} color="#1976d2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content}>
            {/* Training Status */}
            {trainingSession && (
              <View style={styles.trainingStatus}>
                <View style={styles.trainingStatusHeader}>
                  {trainingSession.status === 'training' && <ActivityIndicator size="small" color="#1976d2" />}
                  {trainingSession.status === 'completed' && <CheckCircle size={20} color="#4caf50" />}
                  {trainingSession.status === 'failed' && <AlertCircle size={20} color="#f44336" />}
                  <Text style={styles.trainingStatusText}>
                    {trainingSession.status === 'training' && (language === 'ne' ? 'प्रशिक्षण चलिरहेको छ...' : 'Training in progress...')}
                    {trainingSession.status === 'completed' && (language === 'ne' ? 'प्रशिक्षण सम्पन्न!' : 'Training completed!')}
                    {trainingSession.status === 'failed' && (language === 'ne' ? 'प्रशिक्षण असफल!' : 'Training failed!')}
                  </Text>
                </View>
              </View>
            )}

            {/* Recording Interface */}
            {selectedCommand && (
              <View style={styles.recordingInterface}>
                <Text style={styles.recordingTitle}>
                  {language === 'ne' ? 'नयाँ उदाहरण रेकर्ड गर्नुहोस्' : 'Record New Example'}
                </Text>
                <Text style={styles.recordingSubtitle}>
                  {language === 'ne' ? 'आदेश' : 'Command'}: {language === 'ne' ? (selectedCommand.phraseNe || selectedCommand.phrase) : selectedCommand.phrase}
                </Text>
                
                <TouchableOpacity
                  style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? <MicOff size={32} color="#fff" /> : <Mic size={32} color="#fff" />}
                </TouchableOpacity>
                
                <Text style={styles.recordStatus}>
                  {isRecording 
                    ? (language === 'ne' ? 'रेकर्डिङ...' : 'Recording...')
                    : (language === 'ne' ? 'रेकर्ड गर्न थिच्नुहोस्' : 'Tap to record')
                  }
                </Text>

                {currentRecording && (
                  <View style={styles.recordingResult}>
                    <Text style={styles.recordingResultLabel}>
                      {language === 'ne' ? 'रेकर्ड गरिएको' : 'Recorded'}:
                    </Text>
                    <Text style={styles.recordingResultText}>{currentRecording}</Text>
                    <TouchableOpacity style={styles.addRecordingButton} onPress={addRecordingToCommand}>
                      <Plus size={16} color="#fff" />
                      <Text style={styles.addRecordingButtonText}>
                        {language === 'ne' ? 'थप्नुहोस्' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Commands List */}
            <View style={styles.commandsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {language === 'ne' ? 'प्रशिक्षण आदेशहरू' : 'Training Commands'}
                </Text>
                <TouchableOpacity
                  style={styles.addCommandButton}
                  onPress={() => setShowAddCommand(true)}
                >
                  <Plus size={20} color="#1976d2" />
                </TouchableOpacity>
              </View>

              {commands.map(renderCommandCard)}
            </View>
          </ScrollView>

          {/* Add Command Modal */}
          <Modal
            visible={showAddCommand}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowAddCommand(false)}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {language === 'ne' ? 'नयाँ आदेश थप्नुहोस्' : 'Add New Command'}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowAddCommand(false)}
                >
                  <X size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {language === 'ne' ? 'आदेश वाक्य (अंग्रेजी)' : 'Command Phrase (English)'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Order {quantity} {item}"
                    value={newCommand.phrase}
                    onChangeText={(text) => setNewCommand(prev => ({ ...prev, phrase: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {language === 'ne' ? 'आदेश वाक्य (नेपाली)' : 'Command Phrase (Nepali)'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="जस्तै, {quantity} {item} अर्डर गर्नुहोस्"
                    value={newCommand.phraseNe}
                    onChangeText={(text) => setNewCommand(prev => ({ ...prev, phraseNe: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {language === 'ne' ? 'कार्य प्रकार' : 'Action Type'}
                  </Text>
                  <View style={styles.actionButtons}>
                    {['order', 'expense', 'deposit', 'charging', 'custom'].map((action) => (
                      <TouchableOpacity
                        key={action}
                        style={[
                          styles.actionButton,
                          newCommand.action === action && styles.actionButtonSelected
                        ]}
                        onPress={() => setNewCommand(prev => ({ ...prev, action: action as any }))}
                      >
                        <Text style={[
                          styles.actionButtonText,
                          newCommand.action === action && styles.actionButtonTextSelected
                        ]}>
                          {action}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity style={styles.saveCommandButton} onPress={addNewCommand}>
                  <Save size={20} color="#fff" />
                  <Text style={styles.saveCommandButtonText}>
                    {language === 'ne' ? 'आदेश सुरक्षित गर्नुहोस्' : 'Save Command'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </Modal>
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
    flex: 1,
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  trainingStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  trainingStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trainingStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recordingInterface: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    alignItems: 'center',
  },
  recordingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  recordingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  recordButton: {
    backgroundColor: '#1976d2',
    borderRadius: 50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordButtonActive: {
    backgroundColor: '#d32f2f',
  },
  recordStatus: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  recordingResult: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  recordingResultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  recordingResultText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  addRecordingButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addRecordingButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  commandsSection: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addCommandButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  commandCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  commandCardInactive: {
    opacity: 0.6,
  },
  commandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  commandInfo: {
    flex: 1,
  },
  commandPhrase: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  commandAction: {
    fontSize: 12,
    color: '#1976d2',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  commandActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 6,
  },
  testButton: {
    backgroundColor: '#e3f2fd',
  },
  trainButton: {
    backgroundColor: '#e8f5e8',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#666',
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
    minWidth: 35,
  },
  examplesContainer: {
    marginBottom: 12,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  moreExamples: {
    fontSize: 12,
    color: '#1976d2',
    fontStyle: 'italic',
  },
  commandFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#4caf50',
  },
  toggleButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  selectButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButtonSelected: {
    backgroundColor: '#1976d2',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  actionButtonTextSelected: {
    color: '#fff',
  },
  saveCommandButton: {
    backgroundColor: '#1976d2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 20,
  },
  saveCommandButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});