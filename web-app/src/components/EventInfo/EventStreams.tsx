import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ReactPlayer from 'react-player';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../Stylesheets/theme';

// Display stream video
interface Streams {
    post_date: string;
    stream_title: string;
    stream_url: string;
}

interface TeamStreamsProps {
    streams: Streams[];
}

const EventStreams: React.FC<TeamStreamsProps> = ({ streams }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const playerRef = useRef<HTMLDivElement>(null);
    const [sortedStreams, setSortedStreams] = useState<Streams[]>([]);

    const handleNextSlide = () => {
        setCurrentSlide((prevSlide) => (prevSlide === streams.length - 1 ? 0 : prevSlide + 1));
        scrollToVideo();
    };

    const handlePreviousSlide = () => {
        setCurrentSlide((prevSlide) => (prevSlide === 0 ? streams.length - 1 : prevSlide - 1));
        scrollToVideo();
    };

    const scrollToVideo = () => {
        if (playerRef.current) {
            playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    useEffect(() => {
        const sorted = [...streams].sort((a, b) => new Date(b.post_date).getTime() - new Date(a.post_date).getTime());
        setSortedStreams(sorted);
    }, [streams]);

    if (sortedStreams.length === 0) {
        return <div></div>;
    }

    return (
        <ThemeProvider theme={theme}>
            <Box maxWidth="md" mx="auto">
                <Typography variant="h5" gutterBottom align="center">
                    {sortedStreams[currentSlide].stream_title}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <IconButton onClick={handlePreviousSlide} style={{ color: 'black', marginRight: '8px' }}>
                        <ChevronLeft />
                    </IconButton>
                    <Box ref={playerRef} style={{ width: '100%', height: '400px', overflow: 'hidden' }}>
                        <ReactPlayer url={sortedStreams[currentSlide].stream_url} width="100%" height="100%" controls />
                    </Box>
                    <IconButton onClick={handleNextSlide} style={{ color: 'black', marginLeft: '8px' }}>
                        <ChevronRight />
                    </IconButton>
                </Box>
                <Typography variant="body1" align="center" mt={2}>
                    {`${currentSlide + 1} of ${sortedStreams.length}`}
                </Typography>
            </Box>
        </ThemeProvider>
    );
};

export default EventStreams;
