import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Shuffle, Eye, EyeOff } from 'lucide-react';

const QuestionCards = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  
  const allQuestions = [
    {
      question: "I am the resurrection and the life. The one who believes in me will live, even though they die; and whoever lives by believing in me will never die. Do you believe this?",
      answer: "Jesus to Martha (John 11:25-26)"
    },
    {
      question: "My father! The fire and the wood are here, but where is the lamb for the burnt offering?",
      answer: "Isaac to Abraham (Genesis 22:7)"
    },
    {
      question: "Where you go I will go, and where you stay I will stay.",
      answer: "Ruth to Naomi (Ruth 1:16)"
    },
    {
      question: "Now I know that you fear God, because you have not withheld from me your son, your only son.",
      answer: "Angel of the Lord to Abraham (Genesis 22:12)"
    },
    {
      question: "Do not be afraid, for those who are with us are more than those who are with them.",
      answer: "Elisha to his servant (2 Kings 6:16)"
    },
    {
      question: "Why are you sleeping? Get up and pray so that you will not fall into temptation.",
      answer: "Jesus to His disciples (Luke 22:46)"
    },
    {
      question: "But you intended to harm me, but God intended it for good to accomplish what is now being done, the saving of many lives.",
      answer: "Joseph to his brothers (Genesis 50:20)"
    },
    {
      question: "Do not come any closer. Take off your sandals, for the place where you are standing is holy ground.",
      answer: "God to Moses (Exodus 3:5)"
    },
    {
      question: "If I perish, I perish.",
      answer: "Esther to Mordecai (Esther 4:16)"
    },
    {
      question: "The Lord gave, and the Lord has taken away; may the name of the Lord be praised.",
      answer: "Job (Job 1:21)"
    },
    {
      question: "Lord, if it's you, tell me to come to you on the water.",
      answer: "Peter to Jesus (Matthew 14:28)"
    },
    {
      question: "Where is the one who is born king of the Jews? For we saw his star when it rose and have come to worship him.",
      answer: "Wise men to Herod (Matthew 2:2)"
    },
    {
      question: "I need to be baptized by you, and yet you come to me?",
      answer: "John the Baptist to Jesus (Matthew 3:14)"
    },
    {
      question: "Lord, save us! We are about to die!",
      answer: "Disciples to Jesus during the storm (Matthew 8:25)"
    },
    {
      question: "By what authority are you doing these things, and who gave you this authority?",
      answer: "Chief priests and elders to Jesus (Matthew 21:23)"
    },
    {
      question: "Look, Lord, half of my possessions I now give to the poor, and if I have cheated anyone of anything, I am paying back four times as much!",
      answer: "Zacchaeus to Jesus (Luke 19:8)"
    },
    {
      question: "Permit these two sons of mine to sit, one at your right hand and one at your left, in your kingdom.",
      answer: "Mother of James and John to Jesus (Matthew 20:21)"
    },
    {
      question: "Thus says the LORD, the God of Israel, 'Release my people so that they may hold a pilgrim feast to me in the dessert.",
      answer: "Moses to Pharaoh (Exodus 5:1)"
    },
    {
      question: "I have sinned, for I have disobeyed what the Lord commanded and what you said as well. For I was afraid of the army, and I followed their wishes.",
      answer: "Saul to Samuel (1 Samuel 15:24)"
    },
    {
      question: "I called out to the Lord from my distress, and he answered me; from the belly of Sheol I cried out for help, and you heard my prayer.",
      answer: "Jonah to God (Jonah 2:2)"
    },
    {
      question: "Tell me what makes you so strong and how you can be subdued and humiliated.",
      answer: "Delilah to Samson (Judges 16:6)"
    },
    {
      question: "Are You the Coming One, or do we look for another?",
      answer: "John the Baptist's disciples to Jesus (Matthew 11:3)"
    },
    {
      question: "Let us not kill him. Shed no blood, but cast him into this pit which is in the wilderness, and do not lay a hand on him.",
      answer: "Reuben about Joseph to his brothers (Genesis 37:22)"
    },
    {
      question: "Jesus the Christ heals you. Arise and make your bed.",
      answer: "Peter to Aeneas (Acts 9:34)"
    },
    {
      question: "How can a man be born when he is old? Can he enter a second time into his mother's womb and be born?",
      answer: "Nicodemus to Jesus (John 3:4)"
    },
    {
      question: "Oh that thou wouldest bless me indeed, and enlarge my coast, and that thine hand might be with me, and that thou wouldest keep me from evil, that it might not grieve me!",
      answer: "Jabez to God (1 Chronicles 4:10)"
    },
    {
      question: "What! Could you not watch with Me one hour? Watch and pray, lest you enter into temptation. The spirit indeed is willing, but the flesh is weak.",
      answer: "Jesus to Peter (Matthew 26:40-41)"
    }
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
    setShowAnswer(false);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  };

  const previousQuestion = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
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
          className="relative h-72"
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
              <div className="w-full h-72 bg-white rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <div className="p-6 h-full flex flex-col items-center justify-center bg-gradient-to-br from-white to-blue-50 rounded-xl relative">
                  {/* Headers */}
                  <div className="mb-4 text-center">
                    <h2 className="text-lg font-semibold text-gray-700 mb-1">
                      Who said this, to whom in the Bible?
                    </h2>
                    <p className="text-sm text-blue-600 italic">
                      Extra points for Scriptural Reference
                    </p>
                  </div>

                  {/* Question text */}
                  <motion.p 
                    className="text-xl text-center font-medium text-gray-800 mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {questions[currentIndex]?.question}
                  </motion.p>

                  {/* Show/Hide Answer Button */}
                  <div className="absolute bottom-4 right-4">
                    <button
                      onClick={() => setShowAnswer(!showAnswer)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors text-blue-700"
                    >
                      {showAnswer ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          <span className="text-sm">Hide Answer</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">Show Answer</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Answer */}
                  <AnimatePresence>
                    {showAnswer && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute bottom-16 left-0 right-0 text-center px-6"
                      >
                        <p className="text-green-700 font-medium bg-green-50 py-2 px-4 rounded-lg">
                          {questions[currentIndex]?.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
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