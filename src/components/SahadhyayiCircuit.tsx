import React from "react";
import { BookOpen, Users, Map, Calendar } from "lucide-react";

const SahadhyayiCircuit = () => {
  return (
    <section className="py-16 bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 text-center relative">
        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
          Sahadhyayi Platform Features
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          A circuit of connected tools for every reader
        </p>
        <div className="relative mx-auto w-full max-w-md h-80">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="#3b82f6" strokeWidth="2" />
            <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="#22c55e" strokeWidth="2" />
            <line x1="50%" y1="50%" x2="20%" y2="80%" stroke="#a855f7" strokeWidth="2" />
            <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="#f59e0b" strokeWidth="2" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-white font-semibold">
              Sahadhyayi
            </div>
          </div>
          <div
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
            style={{ left: "20%", top: "20%" }}
          >
            <BookOpen className="w-8 h-8 text-blue-400" />
            <span className="text-white mt-2 text-sm">Library</span>
          </div>
          <div
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
            style={{ left: "80%", top: "20%" }}
          >
            <Users className="w-8 h-8 text-green-400" />
            <span className="text-white mt-2 text-sm">Authors</span>
          </div>
          <div
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
            style={{ left: "20%", top: "80%" }}
          >
            <Map className="w-8 h-8 text-purple-400" />
            <span className="text-white mt-2 text-sm">Community</span>
          </div>
          <div
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
            style={{ left: "80%", top: "80%" }}
          >
            <Calendar className="w-8 h-8 text-orange-400" />
            <span className="text-white mt-2 text-sm">Features</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SahadhyayiCircuit;

