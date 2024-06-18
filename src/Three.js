import * as THREE from 'three';
import { useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { Image, ScrollControls, Billboard, Text, useScroll } from '@react-three/drei';
import { suspend } from 'suspend-react';
import { easing, geometry } from 'maath';

extend(geometry);
const inter = import('@pmndrs/assets/fonts/inter_regular.woff');



export const App = () => (
  <Canvas dpr={[1, 1.5]}>
    <ScrollControls pages={10} infinite>
      <Scene position={[0, 1.5, 0]} />
    </ScrollControls>
  </Canvas>
);

function Scene({ children, ...props }) {
  const ref = useRef();
  const scroll = useScroll();
  const [hoveredName, setHoveredName] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [userInteracted, setUserInteracted] = useState(false);

  // 사용자 상호작용 처리
  useEffect(() => {
    const handleUserInteraction = () => setUserInteracted(true);

    window.addEventListener('click', handleUserInteraction);
    return () => window.removeEventListener('click', handleUserInteraction);
  }, []);

  // 키보드 입력 및 자동 전환 처리
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % 10);
        setLastInteraction(Date.now());
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + 10) % 10);
        setLastInteraction(Date.now());
      }
    };

    const autoTransition = setInterval(() => {
      if (Date.now() - lastInteraction > 15000) { // 15초 후 자동 전환
        setCurrentIndex((prevIndex) => (prevIndex + 1) % 10);
      }
    }, 10000);

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(autoTransition);
    };
  }, [lastInteraction]);

  useEffect(() => {
    setHoveredName(`Card ${currentIndex + 1}`);
  }, [currentIndex]);
  

  useFrame((state, delta) => {
    
    const rotationSpeed = -0.2; // 회전 속도
    ref.current.rotation.y += rotationSpeed * delta; // y축을 기준으로 회전
    // 자동으로 천천히 회전
     -scroll.offset * (Math.PI * 2); // 스크롤에 따라 회전
  
    state.events.update(); // 매 프레임마다 레이캐스트 업데이트
    easing.damp3(state.camera.position, [-state.pointer.x * 2, state.pointer.y * 2 + 4.5, 9], 0.3, delta);
    state.camera.lookAt(0, 0, 0);
  });

  return (
     <group ref={ref} {...props}>
      <Cards category="" from={0} len={Math.PI * 2} currentIndex={currentIndex} userInteracted={userInteracted} />
    
      <ActiveCard hovered={currentIndex} hoveredName={hoveredName} />
    </group>
  );
}


function Cards({ category, from = 0, len = Math.PI * 2, radius = 6.5, currentIndex, userInteracted, ...props }) {
  const amount = 16; // 카드 개수
  const angleStep = len / amount; // 각 카드 사이의 각도
  const names = [
    "Card 2", "오아시스 2", "Card 3", "Card 4", "Card 5", 
    "Card 6", "Card 7", "Card 8", "Card 9", "Card 10",
  ];

  const audioRefs = useRef(names.map((_, i) => new Audio(`/audio/audio${i + 1}.mp3`)));

  // Handle audio play with user interaction
  useEffect(() => {
    if (userInteracted) {
      audioRefs.current.forEach((audio, index) => {
        if (index === currentIndex) {
          playAudioWithUserGesture(audio);
        } else {
          stopAudio(audio);
        }
      });
    }
  }, [currentIndex, userInteracted]);

  // Function to play audio with user gesture
  const playAudioWithUserGesture = (audio) => {
    if (audio.paused) {
      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
      });
    }
  };

  // Function to stop audio
  const stopAudio = (audio) => {
    audio.pause();
    audio.currentTime = 0;
  };

  return (
    <group {...props}>
      <Billboard position={[0, 0.5, radius * 1.4]}>
        <Text font={suspend(inter).default} fontSize={0.25} anchorX="center" color="black">
          {category}
        </Text>
      </Billboard>
      {Array.from({ length: amount }, (_, i) => {
        const angle = from + i * angleStep;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        const name = names[i % names.length];

        return (
          <Card
            key={i}
            position={[x, 0, z]}
            rotation={[0, Math.PI / 1 + angle, 0]}
            active={true}
            hovered={currentIndex === i}
            url={`/img${Math.floor(i % 10) + 1}.jpg`}
            link={`https://example.com/page${i}`}
            name={name}
            audio={audioRefs.current[i % audioRefs.current.length]}
          />
        );
      })}
    </group>

  );
}

function Card({ url, active, hovered, link, name, audio, ...props }) {
  const ref = useRef();

  // Play audio when card is hovered
  useEffect(() => {
    if (hovered) {
      playAudioWithUserGesture(audio);
    } else {
      stopAudio(audio);
    }
  }, [hovered, audio]);

  // Function to play audio with user gesture
  const playAudioWithUserGesture = (audio) => {
    if (audio.paused) {
      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
      });
    }
  };

  // Function to stop audio
  const stopAudio = (audio) => {
    audio.pause();
    audio.currentTime = 0;
  };

  useFrame((state, delta) => {
    const f = hovered ? 1.4 : active ? 1.05 : 1;
    easing.damp3(ref.current.scale, [2.18 * f, 1.5 * f, 1.5], 0.15, delta);
  });

  return (
    <group {...props}>
      <Image
        ref={ref}
        transparent
        radius={0.075}
        url={url}
        scale={[2.618, 1.5, 1.5]}
        side={THREE.DoubleSide}
        onClick={() => window.location.href = link}
        onError={(e) => { e.target.style.display = 'none'; }} // Handle image
      />
    </group>
  );
}

function ActiveCard({ hovered, hoveredName, lastInteraction, ...props }) {
  const ref = useRef();
  const initialPositionY = useRef(0); // 초기 Y 위치 저장
  const hoverAmplitude = 0.2; // 움직임의 진폭
  const [progress, setProgress] = useState(0); // 재생바 진행 상태

  useLayoutEffect(() => {
    initialPositionY.current = ref.current.position.y; // 초기 Y 위치 저장
  }, []);

  useFrame((state, delta) => {
    if (hovered !== null) {
      const y = initialPositionY.current + Math.sin(state.clock.elapsedTime * 3) * hoverAmplitude; // hover 시 위아래로 움직임
      ref.current.position.y = y;
    }
  });

  // Handle image click to redirect
  const handleClick = () => {
    if (hovered !== null) {
      window.location.href = `https://example.com/page${hovered}`;
    }
  };

  return (
    <Billboard {...props}>
    
      <Image
        ref={ref}
        transparent
        radius={0.3}
        position={[0, 0.6, 0]}
        scale={[8.5, 1.618 * 3.5, 0.2]}
        url={`/img${hovered % 10 + 1}.jpg`}
        onClick={handleClick}
      />
      
    </Billboard>
  );
}

export default App;