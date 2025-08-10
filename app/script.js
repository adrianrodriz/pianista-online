class PianoApp {
    constructor() {
        this.audioContext = null;
        this.octave = 4;
        this.tempo = 120;
        this.isRecording = false;
        this.isPlaying = false;
        this.isMetronomeOn = false;
        this.recordedNotes = [];
        this.recordStartTime = 0;
        this.metronomeInterval = null;
        this.activeKeys = new Set();
        
        this.frequencies = {
            'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
            'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
            'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88,
            'C2': 523.25, 'C#2': 554.37, 'D2': 587.33, 'D#2': 622.25,
            'E2': 659.25, 'F2': 698.46, 'F#2': 739.99, 'G2': 783.99,
            'G#2': 830.61, 'A2': 880.00, 'A#2': 932.33, 'B2': 987.77
        };
        
        this.chords = {
            'C': ['C', 'E', 'G'],
            'F': ['F', 'A', 'C'],
            'G': ['G', 'B', 'D'],
            'Am': ['A', 'C', 'E'],
            'Dm': ['D', 'F', 'A'],
            'Em': ['E', 'G', 'B']
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupAudioContext();
        this.updateDisplay();
    }
    
    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error('Web Audio API no está soportado en este navegador');
        }
    }
    
    setupEventListeners() {
        // Controles
        document.getElementById('octave').addEventListener('change', (e) => {
            this.octave = parseInt(e.target.value);
        });
        
        document.getElementById('tempo').addEventListener('input', (e) => {
            this.tempo = parseInt(e.target.value);
            document.getElementById('tempoValue').textContent = this.tempo;
        });
        
        // Botones
        document.getElementById('metronomeBtn').addEventListener('click', () => {
            this.toggleMetronome();
        });
        
        document.getElementById('recordBtn').addEventListener('click', () => {
            this.toggleRecording();
        });
        
        document.getElementById('playBtn').addEventListener('click', () => {
            this.playRecording();
        });
        
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearRecording();
        });
        
        // Teclas del piano
        document.querySelectorAll('.key').forEach(key => {
            key.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.playNote(key.dataset.note);
                key.classList.add('active');
            });
            
            key.addEventListener('mouseup', () => {
                key.classList.remove('active');
            });
            
            key.addEventListener('mouseleave', () => {
                key.classList.remove('active');
            });
        });
        
        // Acordes
        document.querySelectorAll('.chord-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.playChord(btn.dataset.chord);
            });
        });
        
        // Teclado
        document.addEventListener('keydown', (e) => {
            if (this.activeKeys.has(e.key.toLowerCase())) return;
            this.activeKeys.add(e.key.toLowerCase());
            
            const key = document.querySelector(`[data-key="${e.key.toLowerCase()}"]`);
            if (key) {
                this.playNote(key.dataset.note);
                key.classList.add('active');
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.activeKeys.delete(e.key.toLowerCase());
            
            const key = document.querySelector(`[data-key="${e.key.toLowerCase()}"]`);
            if (key) {
                key.classList.remove('active');
            }
        });
        
        // Prevenir comportamiento por defecto del navegador
        document.addEventListener('keydown', (e) => {
            if (['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'w', 'e', 't', 'y', 'u', 'q', 'r', 'i', 'o', 'p'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
    }
    
    playNote(note) {
        if (!this.audioContext) return;
        
        const frequency = this.frequencies[note] * Math.pow(2, this.octave - 4);
        this.createTone(frequency);
        
        // Actualizar display
        document.getElementById('currentNote').textContent = `${note}${this.octave}`;
        
        // Grabar si está grabando
        if (this.isRecording) {
            const time = Date.now() - this.recordStartTime;
            this.recordedNotes.push({
                note: note,
                octave: this.octave,
                time: time
            });
        }
    }
    
    createTone(frequency) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        // Envelope
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1);
        
        oscillator.start(now);
        oscillator.stop(now + 1);
    }
    
    playChord(chordName) {
        const notes = this.chords[chordName];
        if (!notes) return;
        
        notes.forEach((note, index) => {
            setTimeout(() => {
                this.playNote(note);
            }, index * 100);
        });
    }
    
    toggleMetronome() {
        if (this.isMetronomeOn) {
            this.stopMetronome();
        } else {
            this.startMetronome();
        }
    }
    
    startMetronome() {
        this.isMetronomeOn = true;
        document.getElementById('metronomeBtn').classList.add('recording');
        document.getElementById('metronomeBtn').innerHTML = '<i class="fas fa-stop"></i> Parar';
        
        const interval = (60 / this.tempo) * 1000;
        this.metronomeInterval = setInterval(() => {
            this.playMetronomeClick();
        }, interval);
    }
    
    stopMetronome() {
        this.isMetronomeOn = false;
        document.getElementById('metronomeBtn').classList.remove('recording');
        document.getElementById('metronomeBtn').innerHTML = '<i class="fas fa-clock"></i> Metrónomo';
        
        if (this.metronomeInterval) {
            clearInterval(this.metronomeInterval);
            this.metronomeInterval = null;
        }
    }
    
    playMetronomeClick() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }
    
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    startRecording() {
        this.isRecording = true;
        this.recordedNotes = [];
        this.recordStartTime = Date.now();
        
        document.getElementById('recordBtn').classList.add('recording');
        document.getElementById('recordBtn').innerHTML = '<i class="fas fa-stop"></i> Parar';
        document.getElementById('playBtn').disabled = true;
    }
    
    stopRecording() {
        this.isRecording = false;
        
        document.getElementById('recordBtn').classList.remove('recording');
        document.getElementById('recordBtn').innerHTML = '<i class="fas fa-circle"></i> Grabar';
        document.getElementById('playBtn').disabled = false;
        
        if (this.recordedNotes.length > 0) {
            console.log('Grabación completada:', this.recordedNotes);
        }
    }
    
    playRecording() {
        if (this.recordedNotes.length === 0 || this.isPlaying) return;
        
        this.isPlaying = true;
        document.getElementById('playBtn').disabled = true;
        
        this.recordedNotes.forEach((noteData, index) => {
            setTimeout(() => {
                const frequency = this.frequencies[noteData.note] * Math.pow(2, noteData.octave - 4);
                this.createTone(frequency);
                document.getElementById('currentNote').textContent = `${noteData.note}${noteData.octave}`;
            }, noteData.time);
        });
        
        const totalDuration = Math.max(...this.recordedNotes.map(n => n.time)) + 1000;
        setTimeout(() => {
            this.isPlaying = false;
            document.getElementById('playBtn').disabled = false;
            document.getElementById('currentNote').textContent = '-';
        }, totalDuration);
    }
    
    clearRecording() {
        this.recordedNotes = [];
        document.getElementById('playBtn').disabled = true;
        document.getElementById('currentNote').textContent = '-';
    }
    
    updateDisplay() {
        document.getElementById('tempoValue').textContent = this.tempo;
    }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new PianoApp();
});

// Función para activar el contexto de audio en respuesta a interacción del usuario
function activateAudioContext() {
    if (window.pianoApp && window.pianoApp.audioContext && window.pianoApp.audioContext.state === 'suspended') {
        window.pianoApp.audioContext.resume();
    }
}

// Agregar event listeners para activar el audio
document.addEventListener('click', activateAudioContext);
document.addEventListener('keydown', activateAudioContext);

// Funcionalidad para FAQ
document.addEventListener('DOMContentLoaded', () => {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isOpen = answer.style.display === 'block';
            
            // Cerrar todas las respuestas
            document.querySelectorAll('.faq-answer').forEach(ans => {
                ans.style.display = 'none';
            });
            
            // Abrir la respuesta clickeada si no estaba abierta
            if (!isOpen) {
                answer.style.display = 'block';
            }
        });
    });
    
    // Abrir la primera pregunta por defecto
    if (faqQuestions.length > 0) {
        faqQuestions[0].nextElementSibling.style.display = 'block';
    }
    
    // Cargar estadísticas de GitHub
    loadGitHubStats();
});

// Función para cargar estadísticas de GitHub
async function loadGitHubStats() {
    const repoOwner = 'adrianrodriz'; // Usuario de GitHub
    const repoName = 'pianista-online'; // Nombre del repositorio
    
    try {
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`);
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('github-stars').textContent = data.stargazers_count || 0;
            document.getElementById('github-forks').textContent = data.forks_count || 0;
            
            // Obtener número de issues abiertos
            const issuesResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues?state=open`);
            const issuesData = await issuesResponse.json();
            document.getElementById('github-issues').textContent = issuesData.length || 0;
        }
    } catch (error) {
        console.log('No se pudieron cargar las estadísticas de GitHub:', error);
        // Mostrar valores por defecto si hay error
        document.getElementById('github-stars').textContent = '⭐';
        document.getElementById('github-forks').textContent = '🔀';
        document.getElementById('github-issues').textContent = '📝';
    }
} 