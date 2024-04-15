import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link } from '@mui/material';

// This class displays the EventAwards, set as the "default" page for events

interface AwardWinner {
    team: {
        id: string;
        name: string;
    };
}

interface Award {
    id: string;
    title: string;
    teamWinners?: AwardWinner[];
}

interface EventData {
    location?: string;
    season?: string;
    program?: string;
    awards?: Award[];
}

const EventAwards: React.FC<EventData> = ({ awards }) => {

    // Get all Champion / excellence awards
    const championExcellenceAwards = (awards ?? []).filter((award) =>
        award.title?.includes('Champion') || award.title?.includes('Excellence')
    );

    // Get the rest of the awards, - Volunteer of the year award ( minimal data)
    const otherAwards = (awards ?? []).filter((award) =>
        !award.title?.includes('Champion') && !award.title?.includes('Excellence')
        && award.title?.includes('Award') && !award.title?.includes('Volunteer')
    );

    // Divide into a restricted number of rows, based upon items perRow ***
    function chunkArray<T>(array: T[], itemsPerRow: number): T[][] {
        return Array.from({ length: Math.ceil(array.length / itemsPerRow) }, (_, index) =>
            array.slice(index * itemsPerRow, (index + 1) * itemsPerRow)
        );
    }

    return (
        <div>
            {championExcellenceAwards.length > 0 && (
                <div>
                    <div className="event-profile-subtitle champion">Champions</div>
                    <div className="event-profile-info">
                        {championExcellenceAwards.map((award) => (
                            <div className="event-profile-row" key={award.id}>
                                <div className="event-profile-label">{award.title && award.title.substring(0, award.title.indexOf('(') - 1)}</div>
                                <div>
                                    {award.teamWinners &&
                                        award.teamWinners.map((winner) => (
                                            <Link
                                                key={winner.team.id}
                                                component={RouterLink}
                                                to={`/teams/${winner.team.id}`}
                                            >
                                                <div className="event-profile-value">
                                                    {winner.team.name}
                                                </div>
                                            </Link>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {otherAwards.length > 0 && (
              <div>
                  <div className="event-profile-subtitle">Awards</div>
                  <div className="event-profile-info">
                      {chunkArray(otherAwards, 2).map((group, groupIndex) => (
                          <div key={groupIndex}>
                              {group.map((award) => (
                                  <div className="event-profile-row" key={award.id}>
                                      <div className="event-profile-label">{award.title && award.title.substring(0, award.title.indexOf('(') - 1)}</div>
                                      <div>
                                          {award.teamWinners &&
                                              award.teamWinners.map((winner) => (
                                                  <Link
                                                      key={winner.team.id}
                                                      component={RouterLink}
                                                      to={`/teams/${winner.team.id}`}
                                                  >
                                                      <div className="event-profile-value">
                                                          {winner.team.name}
                                                      </div>
                                                  </Link>
                                              ))}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </div>
    );
};

export default EventAwards;
