import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../Stylesheets/eventTable.css';

interface TeamData {
  name: string;
  id: number;
}

interface Skill {
  score: number;
  name: string;
  rank: number;
  team: TeamData;
  type: string;
  attempts: number;
}

interface EventSkillsComponentProps {
  skills: Skill[];
}

const EventSkillsComponent: React.FC<EventSkillsComponentProps> = ({ skills }) => {
  
const [selectedOption, setSelectedOption] = useState<'programming' | 'driver' | 'combined'>('combined');

const programmingSkills = skills.filter(skill => skill.type === "programming");
const driverSkills = skills.filter(skill => skill.type === "driver");

const programmingSkillsMap = new Map<number, Skill[]>();
const driverSkillsMap = new Map<number, Skill[]>();
const combinedSkillsMap = new Map<number, Skill[]>();

programmingSkills.forEach(skill => {
  const teamId = skill.team.id;
  const existingSkills = programmingSkillsMap.get(teamId) || [];
  programmingSkillsMap.set(teamId, [...existingSkills, skill]);
});

driverSkills.forEach(skill => {
  const teamId = skill.team.id;
  const existingSkills = driverSkillsMap.get(teamId) || [];
  driverSkillsMap.set(teamId, [...existingSkills, skill]);
});

skills.forEach(skill => {
  const teamId = skill.team.id;
  const combinedSkills = [
    ...(programmingSkillsMap.get(teamId) || []),
    ...(driverSkillsMap.get(teamId) || [])
  ];
  combinedSkillsMap.set(teamId, combinedSkills);
});

const sortedCombinedSkills = Array.from(combinedSkillsMap.entries()).sort((a, b) => {
  const totalScoreA = a[1].reduce((acc, curr) => acc + curr.score, 0);
  const totalScoreB = b[1].reduce((acc, curr) => acc + curr.score, 0);
  return totalScoreB - totalScoreA;
});
const sortedProgSkills = Array.from(programmingSkillsMap.entries()).sort((a, b) => {
  const totalScoreA = a[1].reduce((acc, curr) => acc + curr.score, 0);
  const totalScoreB = b[1].reduce((acc, curr) => acc + curr.score, 0);
  return totalScoreB - totalScoreA;
});
const sortedDriverSkills = Array.from(driverSkillsMap.entries()).sort((a, b) => {
  const totalScoreA = a[1].reduce((acc, curr) => acc + curr.score, 0);
  const totalScoreB = b[1].reduce((acc, curr) => acc + curr.score, 0);
  return totalScoreB - totalScoreA;
});

console.log(sortedProgSkills);
  

  return (
    <div className = "p-10">
      <div className="skillsListsTitle">Skills List</div>  
      <div className="skillsTable">
        <div className="header col x-small">
            <div className = "header-cell rounded-tl-lg">
            Rank
            </div>
            {sortedCombinedSkills && Array.isArray(sortedCombinedSkills) && sortedCombinedSkills.map(([teamId, skills], index, array) => (
              <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
                  {index + 1}
              </div>
            ))}
        </div>
        <div className="header col score">
            <div className = "header-cell">
            Score
            </div>
            {sortedCombinedSkills && Array.isArray(sortedCombinedSkills) && sortedCombinedSkills.map(([teamId, skills], index, array) => (
                <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
                <div className = "flex gap-2 items-center justify-center">
                  <div className = "scoreDisplay">
                    {skills[0].score + skills[1].score}
                  </div> 
                  <div>
                    (D: {skills[0].score})
                    (P: {skills[1].score})
                  </div>
                </div>
              </div>
            ))}
        </div>
        <div className="header col rankings-t">
            <div className = "header-cell">
            Number
            </div>
            {sortedCombinedSkills && Array.isArray(sortedCombinedSkills) && sortedCombinedSkills.map(([teamId, skills], index, array) => (
              <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
                  <Link className="teamBox" to={`/teams/${teamId}`}>
                      {skills[0].team.name}
                  </Link>
              </div>
            ))}
        </div>
      </div>
    </div>
  );  
}

export default EventSkillsComponent;
