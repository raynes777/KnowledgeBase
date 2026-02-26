package node.visitor;

import content.Content;
import content.TranscludedContent;
import node.DocumentNode;
import node.Node;
import node.RootNode;

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
