import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';

const QuestionCards = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [questions, setQuestions] = useState([]);
  
  const allQuestions = [
    "I am the resurrection and the life. The one who believes in me will live, even though they die; and whoever lives by believing in me will never die. Do you believe this?",
    "My father! The fire and the wood are here, but where is the lamb for the burnt offering?",
    "Where you go I will go, and where you stay I will stay.",
    "Now I know that you fear God, because you have not withheld from me your son, your only son.",
    "Do not be afraid, for those who are with us are more than those who are with them.",
    "Why are you sleeping? Get up and pray so that you will not fall into temptation.",
    "But you intended to harm me, but God intended it for good to accomplish what is now being done, the saving of many lives.",
    "Do not come any closer. Take off your sandals, for the place where you are standing is holy ground.",
    "If I perish, I perish.",
    "The Lord gave, and the Lord has taken away; may the name of the Lord be praised.",
    "Lord, if it’s you, tell me to come to you on the water.",
    "Where is the one who is born king of the Jews? For we saw his star when it rose and have come to worship him.",
    "I need to be baptized by you, and yet you come to me?",
    "Lord, save us! We are about to die!",
    "By what authority are you doing these things, and who gave you this authority?",
    "Look, Lord, half of my possessions I now give to the poor, and if I have cheated anyone of anything, I am paying back four times as much!",
    "Permit these two sons of mine to sit, one at your right hand and one at your left, in your kingdom.",
    "Thus says the LORD, the God of Israel, ‘Release my people so that they may hold a pilgrim feast to me in the dessert.",
    "I have sinned, for I have disobeyed what the Lord commanded and what you said as well. For I was afraid of the army, and I followed their wishes.",
    "I called out to the Lord from my distress, and  he answered me; from the belly of Sheol I cried out for help, and you heard my prayer.",
    "Tell me what makes you so strong and how you can be subdued and humiliated.",
    "Are You the Coming One, or do we look for another?",
    "Let us not kill him. Shed no blood, but cast him into this pit which is in the wilderness, and do not lay a hand on him.",
    "Jesus the Christ heals you. Arise and make your bed.",
    "How can a man be born when he is old? Can he enter a second time into his mother's womb and be born?",
    "Oh that thou wouldest bless me indeed, and enlarge my coast, and that thine hand might be with me, and that thou wouldest keep me from evil, that it might not grieve me!",
    "What! Could you not watch with Me one hour? Watch and pray, lest you enter into temptation. The spirit indeed is willing, but the flesh is weak."

  ];

  useEffect(() => {
    shuffleQuestions();
  }, []);

  const shuffleQuestions = () => {
    const shuffled = [...allQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, 50);
    setQuestions(shuffled);
    setCurrentIndex(0);
  };

  // Touch events handling
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.touches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < questions.length - 1) {
      nextQuestion();
    }
    if (isRightSwipe && currentIndex > 0) {
      previousQuestion();
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    exit: (direction) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.4
      }
    })
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        <div 
          className="relative h-64"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute w-full"
            >
              <div className="w-full h-64 bg-white rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <div className="p-6 h-full flex flex-col items-center justify-center bg-gradient-to-br from-white to-blue-50 rounded-xl">
                  <motion.p 
                    className="text-xl text-center font-medium text-gray-800"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {questions[currentIndex]}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={previousQuestion}
            disabled={currentIndex === 0}
            className={`p-3 rounded-full transition-colors duration-200 ${
              currentIndex === 0 ? 'text-gray-400 bg-gray-100' : 'text-gray-700 hover:bg-blue-100'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={shuffleQuestions}
            className="p-3 rounded-full text-gray-700 hover:bg-blue-100 transition-colors duration-200"
          >
            <Shuffle className="w-6 h-6" />
          </button>

          <button
            onClick={nextQuestion}
            disabled={currentIndex === questions.length - 1}
            className={`p-3 rounded-full transition-colors duration-200 ${
              currentIndex === questions.length - 1 ? 'text-gray-400 bg-gray-100' : 'text-gray-700 hover:bg-blue-100'
            }`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mt-4 text-gray-600 font-medium">
          Question {currentIndex + 1} of {questions.length}
        </div>
      </div>
    </div>
  );
};

export default QuestionCards;