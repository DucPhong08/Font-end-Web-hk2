import React, { useState, useCallback } from 'react';
import { Typography, Button, Spin, Alert, Input, Space } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import TeamCard from '../components/TeamCard';
import { getJoinedTeams, leaveTeam } from '@services/teamServices';
import { Team } from '@services/types/types';
import { TeamState } from '../type';
import { useMessage } from '@hooks/useMessage';
import useDebounce from '@hooks/useDebounce';

const { Title } = Typography;

function JoinedTeamsPage() {
    const { message, contextHolder } = useMessage();
    const [isCollapsed] = useState<boolean>(false);
    const [state, setState] = useState<TeamState>({
        teams: [],
        loading: false,
        error: null,
        total: 0,
        page: 1,
        hasMore: true,
        fetchedPages: [],
    });
    const [searchTitle, setSearchTitle] = useState('');
    const debouncedSearchTitle = useDebounce(searchTitle, 500);

    const limitPerPage = 4;

    const fetchTeams = useCallback(
        async (pageNumber: number) => {
            if (state.fetchedPages.includes(pageNumber) || state.loading) return;

            setState((prev) => ({ ...prev, loading: true, error: null }));
            try {
                const res = await getJoinedTeams(pageNumber, limitPerPage, debouncedSearchTitle);
                const responseData = res.data;
                if (res.success && responseData && Array.isArray(responseData.data)) {
                    setState((prev) => ({
                        ...prev,
                        teams: [
                            ...prev.teams,
                            ...responseData.data.filter(
                                (newTeam: Team) => !prev.teams.some((team) => team.id === newTeam.id),
                            ),
                        ],
                        total: responseData.pagination.total,
                        fetchedPages: [...prev.fetchedPages, pageNumber],
                        hasMore: pageNumber * limitPerPage < responseData.pagination.total,
                    }));
                }
            } catch (err: any) {
                const errorMessage = err.message || 'Lỗi khi tải nhóm đang tham gia';
                setState((prev) => ({ ...prev, error: errorMessage }));
                message.error({ key: 'fetch-error', content: errorMessage });
            } finally {
                setState((prev) => ({ ...prev, loading: false }));
            }
        },
        [state.loading, state.fetchedPages, message, debouncedSearchTitle],
    );

    React.useEffect(() => {
        setState((prev) => ({ ...prev, teams: [], page: 1, fetchedPages: [] }));
        fetchTeams(1);
    }, [debouncedSearchTitle]);

    React.useEffect(() => {
        fetchTeams(state.page);
    }, [state.page, fetchTeams]);

    const handleSeeMore = useCallback(() => {
        setState((prev) => (!prev.loading && prev.hasMore ? { ...prev, page: prev.page + 1 } : prev));
    }, []);

    const handleLeaveTeam = useCallback(
        async (teamId: number) => {
            const loadingKey = 'leave-team';
            message.loading({ key: loadingKey, content: 'Đang rời nhóm...' });

            try {
                const res = await leaveTeam(teamId);
                if (res.success) {
                    setState((prev) => ({
                        ...prev,
                        teams: prev.teams.filter((team) => team.id !== teamId),
                        total: prev.total - 1,
                    }));
                    message.success({ key: loadingKey, content: 'Đã rời nhóm thành công!' });
                } else {
                    message.error({ key: loadingKey, content: res.message || 'Lỗi khi rời nhóm' });
                }
            } catch (error: any) {
                message.error({ key: loadingKey, content: error.message || 'Có lỗi xảy ra khi rời nhóm' });
            }
        },
        [message],
    );

    return (
        <div>
            {contextHolder}
            <div className="flex justify-between items-center mb-6 flex-col md:flex-row">
                <div className="flex items-center gap-4">
                    <Title level={3} className="m-0">
                        Nhóm đang tham gia
                    </Title>
                </div>
                <Input
                    placeholder="Tìm kiếm team..."
                    prefix={<FontAwesomeIcon icon={faSearch} />}
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    className="w-64"
                    allowClear
                />
            </div>

            {state.error && <Alert message={state.error} type="error" className="mb-4" />}
            {state.teams.length === 0 && !state.loading && <p>Chưa tham gia nhóm nào.</p>}
            {!isCollapsed && (
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 py-4">
                        {state.teams.map((team) => (
                            <TeamCard
                                key={team.id}
                                id={team.id}
                                name={team.name}
                                description={team.description}
                                avatar_url={team.avatar_url}
                                created_at={team.created_at}
                                creator_name={team.creator_name}
                                type="joined"
                                onLeave={() => handleLeaveTeam(team.id)}
                            />
                        ))}
                    </div>
                    {state.loading && <Spin tip="Đang tải..." className="block mx-auto my-4" />}
                    <div className="text-center mt-4 space-x-4">
                        {!state.loading && state.hasMore && <Button onClick={handleSeeMore}>Xem thêm</Button>}
                        {state.teams.length > 4 && (
                            <Button
                                onClick={() => {
                                    setState((prev) => ({
                                        ...prev,
                                        teams: prev.teams.slice(0, 4),
                                        page: 1,
                                        fetchedPages: [],
                                        hasMore: true,
                                    }));
                                }}
                            >
                                Thu gọn
                            </Button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default JoinedTeamsPage;
