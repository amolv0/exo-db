import React, { useEffect, useState } from 'react';
import { Box, Switch} from '@mui/material';
import TeamReveals from "./TeamReveals";
import { getSeasonNameFromId } from '../../SeasonEnum';
import '../../Stylesheets/teamInfo.css';

interface LocationData {
  venue: string | null;
  country: string;
  city: string;
  address_1: string;
  address_2: string | null;
  region: string;
}

interface Reveals {
  post_date: string;
  reveal_title: string;
  reveal_url: string;
}

interface JSONComponentProps {
  data: {
    awards: number[];
    elo: Record<number, number>;
    teamskill_rankings: Record<number, number>;
    teamskill_regional_rankings: Record<number, number>;
    events: number[];
    grade: string;
    id: number;
    location: LocationData;
    matches: number[];
    number: string;
    organization: string;
    program: string;
    rankings: number[];
    region: string;
    registered: string;
    reveals: Reveals[];
    robot_name: string;
    skills: number[];
    skills_rankings: Record<number, { [key: string]: number }>;
    skills_regional_ranking: Record<number, { [key: string]: number }>;
    team_name: string;
  } | null;
}



const JSONComponent: React.FC<JSONComponentProps> = ({ data }) => {

  const [showCurrentRankings, setShowCurrentRankings] = useState(true);
  
  useEffect(() => {
  }, [showCurrentRankings]);

  const toggleRankingsDisplay = () => {
    setShowCurrentRankings(prevState => !prevState);
  };

  if (!data) return null;

  const { registered, reveals, skills_rankings, skills_regional_ranking, teamskill_rankings, teamskill_regional_rankings} = data;
  let r = registered;

  // Function to find the maximum ranking based on robot value
  const findRecentRobotRanking = (rankings: Record<number, { [key: string]: number }>) => {
    let maxRanking = Number.MAX_SAFE_INTEGER;
    let maxSeasonId = -1;

    for (const seasonId in rankings) {
      const robotValue = rankings[seasonId]['robot'];
      if (r === 'true') {
        if (Number(seasonId) > maxSeasonId) {
          maxRanking = robotValue;
          maxSeasonId = Number(seasonId);
        }
      } else {
        if (robotValue < maxRanking) {
          maxRanking = robotValue;
          maxSeasonId = Number(seasonId);
        }
      }
    }
    return { maxRanking, maxSeasonId };
  };

  // Function to find the maximum elo ranking
  const findRecentEloRanking = (rankings: Record<number, number>) => {
    let maxRanking = Number.MAX_SAFE_INTEGER;
    let maxSeasonId = -1;

    for (const seasonId in rankings) {
      const eloValue = rankings[seasonId];
      if (r === 'true') { 
        if (Number(seasonId) > maxSeasonId) {
          maxRanking = eloValue;
          maxSeasonId = Number(seasonId);
        }
      } else {
        if (eloValue < maxRanking) {
          maxRanking = eloValue;
          maxSeasonId = Number(seasonId);
        }
      }

    }

    return { maxRanking, maxSeasonId };
  };

  // Extracting recent or max skill ranking based on robot value
  const { maxRanking: maxSkillRanking, maxSeasonId: maxSkillSeasonId } = findRecentRobotRanking(skills_rankings);

  // Extracting recent or max regional skills
  const { maxRanking: maxRegionalSkillRanking, maxSeasonId: maxRegionalSkillSeasonId } = findRecentRobotRanking(skills_regional_ranking);

  // Extracting recent or max elo ranking
  const { maxRanking: maxEloRanking, maxSeasonId: maxEloSeasonId } = findRecentEloRanking(teamskill_rankings);

  // Extracting recent or max elo regional ranking
  const { maxRanking: maxEloRegionalRanking, maxSeasonId: maxEloRegionalSeasonId } = findRecentEloRanking(teamskill_regional_rankings);

  if (registered == 'true') {
    r = 'false';
  }

  // Extracting recent or max skill ranking based on robot value
  const { maxRanking: maxSkillRanking2, maxSeasonId: maxSkillSeasonId2 } = findRecentRobotRanking(skills_rankings);

  // Extracting recent or max regional skills
  const { maxRanking: maxRegionalSkillRanking2, maxSeasonId: maxRegionalSkillSeasonId2 } = findRecentRobotRanking(skills_regional_ranking);

  // Extracting recent or max elo ranking
  const { maxRanking: maxEloRanking2, maxSeasonId: maxEloSeasonId2 } = findRecentEloRanking(teamskill_rankings);

  // Extracting recent or max elo regional ranking
  const { maxRanking: maxEloRegionalRanking2, maxSeasonId: maxEloRegionalSeasonId2 } = findRecentEloRanking(teamskill_regional_rankings);

  return (
    <div>
      {showCurrentRankings === true ? (
        <div>
          <div className = "team-profile-subtitle"> Current Rankings      
          {data.registered === 'true' && (
              <Switch
                checked={!showCurrentRankings}
                onChange={toggleRankingsDisplay}
              />
          )}
          </div>
          <div className = "team-profile-info">
              <div className="team-profile-row">
                <span className="team-profile-rank-label">Skills</span>
                <span className="team-profile-rank-value">{maxSkillRanking}</span>
                <span className="team-profile-rank-label">{maxSkillSeasonId && getSeasonNameFromId(maxSkillSeasonId)}</span>
              </div>
              <div className="team-profile-row">
                <span className="team-profile-rank-label">Regional Skills</span>
                <span className="team-profile-rank-value">{maxRegionalSkillRanking}</span>
                <span className="team-profile-rank-label">{maxRegionalSkillSeasonId && getSeasonNameFromId(maxRegionalSkillSeasonId)}</span>
              </div>
              <div className="team-profile-row">
                <span className="team-profile-rank-label">Elo</span>
                <span className="team-profile-rank-value">{maxEloRanking}</span>
                <span className="team-profile-rank-label">{maxEloSeasonId && getSeasonNameFromId(maxEloSeasonId)}</span>
              </div>
              <div className="team-profile-row">
                <span className="team-profile-rank-label">Regional Elo</span>
                <span className="team-profile-rank-value">{maxEloRegionalRanking}</span>
                <span className="team-profile-rank-label">{maxEloRegionalSeasonId && getSeasonNameFromId(maxEloRegionalSeasonId)}</span>
              </div>
          </div>
        </div>
      ) : (    
        <div>
          <div className = "team-profile-subtitle"> Highest Rankings 
          {data.registered === 'true' && (
              <Switch
                checked={!showCurrentRankings}
                onChange={toggleRankingsDisplay}
              />
          )}</div>
          <div className = "team-profile-info">
              <div className="team-profile-row">
                <span className="team-profile-rank-label">Skills</span>
                <span className="team-profile-rank-value">{maxSkillRanking2}</span>
                <span className="team-profile-rank-label">{maxSkillSeasonId2 && getSeasonNameFromId(maxSkillSeasonId2)}</span>
              </div>
              <div className="team-profile-row">
                <span className="team-profile-rank-label">Regional Skills</span>
                <span className="team-profile-rank-value">{maxRegionalSkillRanking2}</span>
                <span className="team-profile-rank-label">{maxRegionalSkillSeasonId2 && getSeasonNameFromId(maxRegionalSkillSeasonId2)}</span>
              </div>
              <div className="team-profile-row">
                <span className="team-profile-rank-label">Elo</span>
                <span className="team-profile-rank-value">{maxEloRanking2}</span>
                <span className="team-profile-rank-label">{maxEloSeasonId2 && getSeasonNameFromId(maxEloSeasonId2)}</span>
              </div>
              <div className="team-profile-row">
                <span className="team-profile-rank-label">Regional Elo</span>
                <span className="team-profile-rank-value">{maxEloRegionalRanking2}</span>
                <span className="team-profile-rank-label">{maxEloRegionalSeasonId2 && getSeasonNameFromId(maxEloRegionalSeasonId2)}</span>
              </div>
          </div>
        </div>
        )}

      {/* Reveals Section */}
      {reveals && (
        <Box mt={3}>
          <TeamReveals reveals={reveals} />
        </Box>
      )}
    </div>
  );
  
};

export default JSONComponent;
