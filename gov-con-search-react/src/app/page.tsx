'use client'

import React, { useState } from 'react';
import { Input, Button, List, Space, Spin, Tabs, Tooltip} from 'antd';
import { SearchOutlined, HeartOutlined } from '@ant-design/icons';
import { db } from "../firebase/firebase"
import { getDatabase, onValue, ref, push, set} from "firebase/database";
const { TabPane } = Tabs;

type SearchResult = {
  Title: string;
  Link: string;
  Description: string;
  Score: number;
};

function toTitleCase(str: string): string {
  return str.replace(/(^|[^a-zA-Z\s])([a-zA-Z])|\s([a-zA-Z])/g, (match: string, p1: string, p2: string, p3: string) => {
      if (p3) return ' ' + p3.toUpperCase();
      return p1 + p2.toUpperCase();
  });
}

const Page: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  //const [likedResults, setLikedResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('1');

  const likeResult = (result: SearchResult) => {
    // For demonstration, we'll add a dummy entry into Realtime Database every time the 'like' button is clicked.
    const dummyData = {
      searchQuery: "Dummy Search Query",
      resultTitle: "Dummy Result Title",
      resultDescription: "This is a dummy description for testing purposes.",
      reward: true
    };

    const database = getDatabase(); // Assuming you initialized your app elsewhere.
    const likedResultsRef = ref(database, 'likedResults');
    const newRef = push(likedResultsRef);

    set(newRef, dummyData)
    .then(() => {
        console.log("Data written successfully.");
    })
    .catch((error) => {
        console.error("Error writing data: ", error);
    });
  };

  const search = async () => {
    setIsLoading(true);
    try {
      // change to a GET request and pass the query as a URL parameter
      const response = await fetch(`http://localhost:5000/search?query=${encodeURIComponent(query)}`, {
        method: 'GET', // change method to GET
        // headers and body are not needed for a GET request
      });

      const data: SearchResult[] = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
};


  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Tabs defaultActiveKey="1" onChange={(key) => setActiveTab(key)}>
        <TabPane tab="Search" key="1">
          <Input
            placeholder="Enter your search query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={search}
            suffix={<Button icon={<SearchOutlined />} onClick={search} />}
          />
          {isLoading ? (
            <Spin tip="Loading" size="large" style={{ marginTop: '50px' }}>
              <div className="content" />
            </Spin>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={results}
              renderItem={(result, index) => ( // Add the index parameter
                <List.Item
                  key={index} // Assign the key prop to the List.Item
                  actions={[
                    <Tooltip title="Like this result" key="likeButtonTooltip">
                      <Button
                        shape="circle"
                        icon={<HeartOutlined />}
                        onClick={() => likeResult(result)}
                      />
                    </Tooltip>,
                  ]}
                >
                <List.Item.Meta
                    title={<a href={result.Link}>{toTitleCase(result.Title)}</a>}
                    description={
                      result.Description && typeof result.Description === 'string' 
                        ? (result.Description.length > 100
                            ? `${result.Description.substring(0, 100)}...`
                            : result.Description)
                        : "Description not available"
                    }
                />


                  <div>Score: {result.Score}
                  </div>
                </List.Item>
              )}
            />
          )}
        </TabPane>
        <TabPane tab="Favorites" key="2">
          Favorites
        </TabPane>
      </Tabs>
    </Space>
  );
  
};

export default Page;
