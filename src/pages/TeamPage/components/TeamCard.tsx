import React from 'react';
import { Card, Typography, Dropdown, Button, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers,
    faEllipsisV,
    faBriefcase,
    faPencilAlt,
    faTrash,
    faUser,
    faSignOutAlt,
    faDashboard,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Text } = Typography;

interface TeamCardProps {
    id: number;
    name: string;
    description?: string;
    avatar_url: string | null;
    created_at?: string;
    creator_name: string;
    type: 'joined' | 'created';
    onEdit?: () => void;
    onDelete?: () => void;
    onLeave?: () => void;
}

const TeamCard = ({ id, name, avatar_url, creator_name, type, onEdit, onDelete, onLeave }: TeamCardProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    const getTeamType = () => {
        if (location.pathname.includes('/teams/created')) {
            return 'created';
        }
        if (location.pathname.includes('/teams/joined')) {
            return 'joined';
        }
        return type;
    };

    const handleCardClick = () => {
        const teamType = getTeamType();
        navigate(`/teams/${teamType}/${id}`);
    };

    const handleDropdownClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleActionClick = (e: React.MouseEvent, tab: string) => {
        e.stopPropagation();
        const teamType = getTeamType();
        navigate(`/teams/${teamType}/${id}?tab=${tab}`);
    };

    const items = [
        ...(onDelete
            ? [
                  {
                      key: 'delete',
                      label: 'Xóa',
                      icon: <FontAwesomeIcon icon={faTrash} className="mr-2 text-red-500" />,
                      onClick: onDelete,
                      danger: true,
                  },
              ]
            : []),
        ...(onLeave
            ? [
                  {
                      key: 'leave',
                      label: 'Rời nhóm',
                      icon: <FontAwesomeIcon icon={faSignOutAlt} className="mr-2 text-red-500" />,
                      onClick: onLeave,
                      danger: true,
                  },
              ]
            : []),
    ];

    return (
        <Card
            hoverable
            className="w-full rounded-lg shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {avatar_url ? (
                            <img src={avatar_url} alt={name} className="w-full h-full object-cover" />
                        ) : (
                            <FontAwesomeIcon icon={faUsers} className="text-blue-500 text-xl" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <Text className="font-semibold text-base block truncate" title={name}>
                            {name}
                        </Text>
                        <div className="flex items-center mt-1 text-gray-500 text-sm">
                            <FontAwesomeIcon icon={faUser} className="mr-1 text-xs" />
                            <Text className="text-sm text-gray-600 truncate" title={creator_name}>
                                {creator_name}
                            </Text>
                        </div>
                    </div>
                </div>

                {items.length > 0 && (
                    <div onClick={handleDropdownClick}>
                        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                            <Button
                                type="text"
                                icon={
                                    <FontAwesomeIcon
                                        icon={faEllipsisV}
                                        className="text-gray-400 hover:text-gray-600 text-base"
                                    />
                                }
                                className="hover:bg-gray-100 rounded-full"
                            />
                        </Dropdown>
                    </div>
                )}
            </div>

            {/* Responsive action buttons */}
            <div className="flex justify-around lg:justify-around border-t border-gray-100 pt-3 mt-2 flex-wrap gap-2">
                <Tooltip title="Tổng quan">
                    <div
                        onClick={(e) => handleActionClick(e, 'overview')}
                        className="flex flex-col items-center text-gray-500 hover:text-blue-600 transition-colors duration-200 p-2 rounded-md hover:bg-blue-50 cursor-pointer group min-w-0 flex-1 lg:flex-initial"
                    >
                        <FontAwesomeIcon
                            icon={faDashboard}
                            className="text-lg group-hover:scale-110 transition-transform duration-200"
                        />
                        <span className="text-xs mt-1 group-hover:text-blue-600 text-center">Tổng quan</span>
                    </div>
                </Tooltip>
                <Tooltip title="Công việc">
                    <div
                        onClick={(e) => handleActionClick(e, 'tasks')}
                        className="flex flex-col items-center text-gray-500 hover:text-blue-600 transition-colors duration-200 p-2 rounded-md hover:bg-blue-50 cursor-pointer group min-w-0 flex-1 lg:flex-initial"
                    >
                        <FontAwesomeIcon
                            icon={faBriefcase}
                            className="text-lg group-hover:scale-110 transition-transform duration-200"
                        />
                        <span className="text-xs mt-1 group-hover:text-blue-600 text-center">Công việc</span>
                    </div>
                </Tooltip>
                {onEdit && (
                    <Tooltip title="Chỉnh sửa">
                        <div
                            onClick={(e) => handleActionClick(e, 'settings')}
                            className="flex flex-col items-center text-gray-500 hover:text-blue-600 transition-colors duration-200 p-2 rounded-md hover:bg-blue-50 cursor-pointer group min-w-0 flex-1 lg:flex-initial"
                        >
                            <FontAwesomeIcon
                                icon={faPencilAlt}
                                className="text-lg group-hover:scale-110 transition-transform duration-200"
                            />
                            <span className="text-xs mt-1 group-hover:text-blue-600 text-center">Chỉnh sửa</span>
                        </div>
                    </Tooltip>
                )}
            </div>
        </Card>
    );
};

export default TeamCard;