export function getSeasonNameFromId(id: number): string {
    switch (id) {
        case 182:
        return 'VEXU Over Under';
        case 181:
        return 'VEX Over Under';
        case 180:
        return 'VIQRC Full Volume';

        case 174:
        return 'VEXU Spin Up';

        case 173:
        return 'VEX Spin Up';

        case 155:
        return 'VEXU Tipping Point';
        
        case 154:
        return 'VEX Tipping Point';

        case 140:
        return 'VEXU Change Up';

        case 139:
        return 'VEX Change Up';

        case 131:
        return 'VEXU Tower Takeover';

        case 130:
        return 'VEX Tower Takeover';

        case 126:
        return 'VEXU Turning Point';

        case 125:
        return 'VEX Turning Point';

        case 120:
        return 'VEXU In The Zone';

        case 119:
        return 'VEX In The Zone';

        case 116:
        return 'VEXU Starstruck';

        case 115:
        return 'VEX Starstruck';

        case 111:
        return 'VEXU Nothing But Net';

        case 110:
        return 'VEX Nothing But Net';

        case 103:
        return 'VEXU Skyrise';
    
        case 102:
        return 'VEX Skyrise';
        
        case 93:
        return 'VEXU TossUp';

        case 92:
        return 'VEX TossUp';

        default:
        return id.toString();
    }
}
  