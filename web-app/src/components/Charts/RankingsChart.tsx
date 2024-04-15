import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import SeasonDropdown from '../Dropdowns/SeasonDropDown';
import { parseISO, format } from 'date-fns'; 
import { LineChart } from '@mui/x-charts/LineChart';

interface RankingItem {
  event_id: string;
  event_name: string;
  event_start: string;
  average_points: number;
  total_points: number;
  dpr: number;
  rank: number;
  season: number
}

interface TeamRankingsProps {
  rankings: number[]; // Rankings IDs or similar identifiers
}

const divideIntoGroups = (arr: number[], groupSize: number): number[][] => {
  const groups: number[][] = [];
  for (let i = 0; i < arr.length; i += groupSize) {
      groups.push(arr.slice(i, i + groupSize));
  }
  return groups;
};

const TeamRankingsChart: React.FC<TeamRankingsProps> = ({ rankings }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<{ x: Date; y: number; event_name: string }[]>([]);
  const [groupsOf50, setGroupsOf50] = useState<number[][]>([]);
  const [isFirstUseEffectDone, setIsFirstUseEffectDone] = useState<boolean>(false);

  useEffect(() => {
    console.log("rankings:", rankings)
    if (rankings) {
      const uniqueRankings = rankings.filter((value, index, self) => {
          return self.indexOf(value) === index;
      });
      // Divide uniqueRankings into groups of 50
      console.log("unique rankings:", uniqueRankings)
      const groupedIds: number[][] = divideIntoGroups(uniqueRankings, 50);
      console.log("grouped ids:", groupedIds)
      setGroupsOf50(groupedIds); 
      console.log("groupdso fo 50", groupsOf50)
      setIsFirstUseEffectDone(true);
  }
}, [rankings]);
  useEffect(() => {
    if (!isFirstUseEffectDone){
      return
    }
    const fetchRankingsDetails = async () => {
      if (rankings && rankings.length > 0) {
        try {
          setLoading(true);
          const rankingsData: RankingItem[] = [];
          console.log("groups of 50 len:", groupsOf50.length)
          for (let i = 0; i < groupsOf50.length; i++) {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/dev/rankings/`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(groupsOf50[i])
            });
            const data: RankingItem[] = await response.json();
            console.log("response:", response)
            rankingsData.push(...data);
          }
          rankingsData.sort((a, b) => new Date(a.event_start).toISOString().localeCompare(new Date(b.event_start).toISOString()));
          console.log("rankings data:", rankingsData)
          
          const newChartData = rankingsData.map((data, index) => ({
            x: new Date(rankingsData[index].event_start),
            y: data.rank,
            event_name: data.event_name
          }));
          console.log("chart data:", newChartData)
          setChartData(newChartData);
        } catch (error) {
          console.error('Error fetching rankings:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchRankingsDetails();
  }, [rankings, isFirstUseEffectDone]);  // Dependency array ensures this effect runs when rankings prop changes

  return (
    <div>
      {loading ? (
        <CircularProgress style={{ margin: '20px' }} />
      ) : (
        <LineChart
          xAxis={[{ data: chartData.map(point => point.x), scaleType: 'utc' }]}
          yAxis={[{ reverse: true, min: 0, tickLabelPlacement: 'tick'}]}
          series={[{ data: chartData.map(point => point.y)}]}
          width={500}
          height={300}
        />
      )}
    </div>
  );
};

export default TeamRankingsChart;