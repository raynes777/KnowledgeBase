package com.ctd.xanadu.node.visitor;

import com.ctd.xanadu.content.Content;
import com.ctd.xanadu.content.TranscludedContent;
import com.ctd.xanadu.node.DocumentNode;
import com.ctd.xanadu.node.Node;
import com.ctd.xanadu.node.RootNode;

public class Transcluder implements NodeVisitor<Node> {

	@Override
	public Node visitDocumentNode(DocumentNode n) {
		DocumentNode.builder nodeBuilder = DocumentNode.builder.get();
		Content<Node> newNodeContent = TranscludedContent.from(n);
		return nodeBuilder.withContent(newNodeContent).build();
	}

	@Override
	public Node visitRootNode(RootNode n) {
		return RootNode.getInstance();
	}

	public static Transcluder get() {
		return new Transcluder();
	}

}
