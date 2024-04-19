import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ReactPlayer from 'react-player';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

// Display reveal video
interface Reveals {
    post_date: string;
    reveal_title: string;
    reveal_url: string;
}

interface TeamRevealsProps {
    reveals: Reveals[];
}

const TeamReveals: React.FC<TeamRevealsProps> = ({ reveals }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const playerRef = useRef<HTMLDivElement>(null);
    const [sortedReveals, setSortedReveals] = useState<Reveals[]>([]);

    const handleNextSlide = () => {
        setCurrentSlide((prevSlide) => (prevSlide === reveals.length - 1 ? 0 : prevSlide + 1));
        scrollToVideo();
    };

    const handlePreviousSlide = () => {
        setCurrentSlide((prevSlide) => (prevSlide === 0 ? reveals.length - 1 : prevSlide - 1));
        scrollToVideo();
    };

    const scrollToVideo = () => {
        if (playerRef.current) {
            playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    useEffect(() => {
        const sorted = [...reveals].sort((a, b) => new Date(b.post_date).getTime() - new Date(a.post_date).getTime());
        setSortedReveals(sorted);
    }, [reveals]);

    if (sortedReveals.length === 0) {
        return <div></div>;
    }

    return (
        <Box maxWidth="md" mx="auto">
            <Typography variant="h5" gutterBottom align="center">
                {sortedReveals[currentSlide].reveal_title}
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <IconButton onClick={handlePreviousSlide} style={{ color: 'black', marginRight: '8px' }}>
                    <ChevronLeft />
                </IconButton>
                <Box ref={playerRef} style={{ width: '100%', height: '400px', overflow: 'hidden' }}>
                    <ReactPlayer url={sortedReveals[currentSlide].reveal_url} width="100%" height="100%" controls />
                </Box>
                <IconButton onClick={handleNextSlide} style={{ color: 'black', marginLeft: '8px' }}>
                    <ChevronRight />
                </IconButton>
            </Box>
            <Typography variant="body1" align="center" mt={2}>
                {`${currentSlide + 1} of ${sortedReveals.length}`}
            </Typography>
        </Box>
    );
};

export default TeamReveals;
